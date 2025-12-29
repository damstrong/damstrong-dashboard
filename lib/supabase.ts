// lib/supabase.ts
import { createBrowserClient } from "@supabase/ssr";

const supabase = await createSupabaseServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
