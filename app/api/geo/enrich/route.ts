import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pickGeo(geo: any) {
  const lat = geo?.latitude ?? null;
  const lng = geo?.longitude ?? null;
  const city = geo?.city ?? null;
  const region = geo?.region ?? null;
  const country = geo?.country_name ?? geo?.country ?? null;
  return { lat, lng, city, region, country };
}

export async function POST() {
  // Pull more rows but we will dedupe by IP
  const { data: rows, error } = await supabaseAdmin
    .from("web_events")
    .select("id, ip")
    .is("lat", null)
    .not("ip", "is", null)
    .limit(500);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, enrichedIps: 0, message: "No rows to enrich" });
  }

  // Deduplicate IPs
  const ips = Array.from(new Set(rows.map((r) => String(r.ip)))).slice(0, 25); // cap to 25 IPs/run

  let enrichedIps = 0;
  const failures: any[] = [];

  for (const ip of ips) {
    try {
      // Throttle to avoid rate limits
      await sleep(350);

      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: { "User-Agent": "damstrong-dashboard/1.0" },
      });

      const text = await res.text();

      // ipapi rate limit returns plain text like "Too many requests"
      if (!text.trim().startsWith("{")) {
        failures.push({ ip, reason: text.slice(0, 80) });
        continue;
      }

      const geo = JSON.parse(text);
      const { lat, lng, city, region, country } = pickGeo(geo);

      if (lat == null || lng == null) {
        failures.push({ ip, reason: "no_lat_lng" });
        continue;
      }

      // Update ALL rows with this IP that are missing geo
      const upd = await supabaseAdmin
        .from("web_events")
        .update({ lat, lng, city, region, country })
        .eq("ip", ip)
        .is("lat", null);

      if (upd.error) {
        failures.push({ ip, reason: upd.error.message });
        continue;
      }

      enrichedIps++;
    } catch (e: any) {
      failures.push({ ip, reason: e?.message || "unknown" });
    }
  }

  return NextResponse.json({
    ok: true,
    attemptedIps: ips.length,
    enrichedIps,
    failures,
    tip: "Run again to continue; this endpoint enriches up to 25 unique IPs per call.",
  });
}
