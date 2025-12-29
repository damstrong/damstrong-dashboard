"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    async function run() {
      // If we got implicit tokens in the URL hash, set them
      const hash = window.location.hash; // "#access_token=...&refresh_token=...&type=magiclink"
      if (hash && hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            setMsg(error.message);
            router.replace(`/login?e=${encodeURIComponent(error.message)}`);
            return;
          }
        }
      }

      // Ensure session exists then go home
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/");
      else router.replace("/login?e=missing_session");
    }

    run();
  }, [router]);

  return (
    <div style={{ maxWidth: 520, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{msg}</h1>
    </div>
  );
}
