import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// IMPORTANT:
// Put these in Netlify env vars (server-side, NOT NEXT_PUBLIC):
// SUPABASE_URL = https://xxxxx.supabase.co
// SUPABASE_SERVICE_ROLE_KEY = your service role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function pickGeo(geo: any) {
  // ipapi.co format
  const lat = geo?.latitude ?? null;
  const lng = geo?.longitude ?? null;
  const city = geo?.city ?? null;
  const region = geo?.region ?? geo?.region_code ?? null;
  const country = geo?.country_name ?? geo?.country ?? null;

  return { lat, lng, city, region, country };
}

export async function POST() {
  // get up to 50 rows missing lat/lng but with an IP
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
    return NextResponse.json({ ok: true, message: "No rows to enrich", enriched: 0 });
  }

  let enriched = 0;
  const failures: any[] = [];

  for (const r of rows) {
    try {
      const ip = String(r.ip);
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
      failures.push({ id: r.id, ip: String(r.ip), reason: e?.message || "unknown" });
    }
  }

  return NextResponse.json({ ok: true, enriched, attempted: rows.length, failures });
}
