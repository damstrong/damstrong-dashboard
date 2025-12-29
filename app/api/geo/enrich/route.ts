import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  // Pull more rows but dedupe by IP
  const { data: rows, error } = await supabaseAdmin
    .from("web_events")
    .select("ip")
    .is("lat", null)
    .not("ip", "is", null)
    .limit(1000);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, message: "No rows to enrich", attemptedIps: 0, enrichedIps: 0 });
  }

  const ips = Array.from(new Set(rows.map((r) => String(r.ip)))).slice(0, 25);

  let enrichedIps = 0;
  const failures: any[] = [];

  for (const ip of ips) {
    try {
      await sleep(250);

      const res = await fetch(`https://ipwho.is/${ip}`, {
        headers: { "User-Agent": "damstrong-dashboard/1.0" },
      });

      const geo = await res.json();

      if (!geo?.success || geo?.latitude == null || geo?.longitude == null) {
        failures.push({ ip, reason: geo?.message || "no_lat_lng" });
        continue;
      }

      const lat = geo.latitude;
      const lng = geo.longitude;
      const city = geo.city ?? null;
      const region = geo.region ?? null;
      const country = geo.country ?? null;

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
    tip: "Run again to continue (25 unique IPs per run).",
  });
}
