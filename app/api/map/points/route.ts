import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from"); // YYYY-MM-DD
  const to = url.searchParams.get("to");     // YYYY-MM-DD

  // Build query
  let q = supabaseAdmin
    .from("web_events")
    .select("lat,lng,city,region,country")
    .not("lat", "is", null)
    .not("lng", "is", null);

  // Filter by iso_time if provided
  // Treat to as inclusive end-of-day
  if (from) q = q.gte("iso_time", `${from}T00:00:00Z`);
  if (to) q = q.lte("iso_time", `${to}T23:59:59Z`);

  const { data, error } = await q.limit(5000);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Aggregate identical points
  const map = new Map<string, any>();
  for (const r of data ?? []) {
    const key = `${r.lat},${r.lng},${r.city ?? ""},${r.region ?? ""},${r.country ?? ""}`;
    const cur = map.get(key);
    if (cur) cur.count += 1;
    else map.set(key, { ...r, count: 1 });
  }

  return NextResponse.json(Array.from(map.values()));
}
