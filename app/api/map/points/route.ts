import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * event_key format example:
 *   v_qnbdlzsdj1767019964431|2025-12-29T15:04:31.123Z
 *
 * We extract the YYYY-MM-DD portion for filtering.
 */

function startOfDay(d: string) {
  return `${d}T00:00:00.000Z`;
}

function endOfDay(d: string) {
  return `${d}T23:59:59.999Z`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from"); // YYYY-MM-DD
    const to = url.searchParams.get("to");     // YYYY-MM-DD

    let q = supabaseAdmin
      .from("web_events")
      .select("lat,lng,city,region,country,event_key")
      .not("lat", "is", null)
      .not("lng", "is", null)
      .not("event_key", "is", null);

    // Filter by date embedded in event_key
    if (from) {
      q = q.gte("event_key", `|${startOfDay(from)}`);
    }
    if (to) {
      q = q.lte("event_key", `|${endOfDay(to)}`);
    }

    const { data, error } = await q.limit(10000);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const agg = new Map<string, any>();

    for (const r of data ?? []) {
      const lat = Number(r.lat);
      const lng = Number(r.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

      const key = `${lat.toFixed(6)},${lng.toFixed(6)},${r.city ?? ""},${r.region ?? ""},${r.country ?? ""}`;
      const cur = agg.get(key);

      if (cur) {
        cur.count += 1;
      } else {
        agg.set(key, {
          lat,
          lng,
          city: r.city ?? null,
          region: r.region ?? null,
          country: r.country ?? null,
          count: 1,
        });
      }
    }

    return NextResponse.json(Array.from(agg.values()), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
