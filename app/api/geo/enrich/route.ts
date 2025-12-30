import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST() {
  // Pull a bunch of rows missing geo, but we will enrich UNIQUE IPs only
  const { data, error } = await supabaseAdmin
    .from("web_events")
    .select("ip")
    .is("lat", null)
    .not("ip", "is", null)
    .limit(2000);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const uniqueIps = Array.from(new Set((data ?? []).map((r) => String(r.ip))))
    .slice(0, 25); // 25 unique IPs per run

  if (uniqueIps.length === 0) {
    return NextResponse.json({ ok: true, version: "unique-ip-v1", attemptedIps: 0, enrichedIps: 0 });
  }

  let enrichedIps = 0;
  const failures: any[] = [];

  for (const ip of uniqueIps) {
    try {
      await sleep(250);

      // Use ipwho.is (JSON, generally less annoying than ipapi.co)
      const res = await fetch(`https://ipwho.is/${ip}`, {
        headers: { "User-Agent": "damstrong-dashboard/1.0" },
      });

      const geo = await res.json();

      if (!geo?.success || geo.latitude == null || geo.longitude == null) {
        failures.push({ ip, reason: geo?.message || "no_lat_lng" });
        continue;
      }

      const { error: updErr } = await supabaseAdmin
        .from("web_events")
        .update({
          lat: geo.latitude,
          lng: geo.longitude,
          city: geo.city ?? null,
          region: geo.region ?? null,
          country: geo.country ?? null,
        })
        .eq("ip", ip)
        .is("lat", null);

      if (updErr) {
        failures.push({ ip, reason: updErr.message });
        continue;
      }

      enrichedIps++;
    } catch (e: any) {
      failures.push({ ip, reason: e?.message || "unknown" });
    }
  }

  return NextResponse.json({
    ok: true,
    version: "unique-ip-v1",
    attemptedIps: uniqueIps.length,
    enrichedIps,
    failures,
  });
}
