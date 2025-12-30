import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function daysBetween(from: string, to: string): string[] {
  // returns list of YYYY-MM-DD inclusive (UTC-safe enough for just dates)
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return out;
  if (end < start) return out;

  for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
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

    /**
     * Since event_key looks like:
     *   <something>|2025-12-29T...
     *
     * The only reliable filter without a real timestamp column is pattern matching:
     *   event_key ilike '%|YYYY-MM-DD%'
     *
     * For a date range, we OR together each day.
     */
    if (from && to) {
      const days = daysBetween(from, to);

      // Prevent someone selecting 5 years and killing the DB
      if (days.length > 120) {
        return NextResponse.json(
          { ok: false, error: "Date range too large (max 120 days for now)." },
          { status: 400 }
        );
      }

      if (days.length > 0) {
        const ors = days.map((d) => `event_key.ilike.%|${d}%`).join(",");
        q = q.or(ors);
      }
    } else if (from) {
      q = q.ilike("event_key", `%|${from}%`);
    } else if (to) {
      q = q.ilike("event_key", `%|${to}%`);
    }

    const { data, error } = await q.limit(10000);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const agg = new Map<string, any>();

    for (const r of data ?? []) {
      const lat = Number((r as any).lat);
      const lng = Number((r as any).lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;

      const key = `${lat.toFixed(6)},${lng.toFixed(6)},${r.city ?? ""},${r.region ?? ""},${r.country ?? ""}`;
      const cur = agg.get(key);

      if (cur) cur.count += 1;
      else {
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
