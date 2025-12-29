import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // Pull geo rows and aggregate in JS (simple + avoids SQL functions)
  const { data, error } = await supabaseAdmin
    .from("web_events")
    .select("lat,lng,city,region,country")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .limit(5000);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const map = new Map<string, any>();

  for (const r of data ?? []) {
    const key = `${r.lat},${r.lng},${r.city ?? ""},${r.region ?? ""},${r.country ?? ""}`;
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { lat: r.lat, lng: r.lng, city: r.city, region: r.region, country: r.country, count: 1 });
  }

  return NextResponse.json(Array.from(map.values()));
}
