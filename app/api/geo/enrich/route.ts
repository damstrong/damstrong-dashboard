import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function pickGeo(geo: any) {
  // ipapi.co format
  const lat = geo?.latitude ?? null;
  const lng = geo?.longitude ?? null;
  const city = geo?.city ?? null;
  const region = geo?.region ?? null;
  const country = geo?.country_name ?? geo?.country ?? null;
  return { lat, lng, city, region, country };
}

export async function POST() {
  // grab a batch of rows missing lat/lng
  const { data: rows, error } = await supabaseAdmin
    .from("web_events")
    .select("id, ip")
    .is("lat", null)
    .not("ip", "is", null)
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, enriched: 0, message: "No rows to enrich" });
  }

  let enriched = 0;
  const failures: any[] = [];

  for (const r of rows) {
    const ip = String(r.ip);
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: { "User-Agent": "damstrong-dashboard/1.0" },
      });
      const geo = await res.json();
      const { lat, lng, city, region, country } = pickGeo(geo);

      if (lat == null || lng == null) {
        failures.push({ id: r.id, ip, reason: "no_lat_lng" });
        continue;
      }

      const upd = await supabaseAdmin
        .from("web_events")
        .update({ lat, lng, city, region, country })
        .eq("id", r.id);

      if (upd.error) {
        failures.push({ id: r.id, ip, reason: upd.error.message });
        continue;
      }

      enriched++;
    } catch (e: any) {
      failures.push({ id: r.id, ip, reason: e?.message || "unknown" });
    }
  }

  return NextResponse.json({ ok: true, attempted: rows.length, enriched, failures });
}
