"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthFinishPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    async function run() {
      const hash = window.location.hash;

      // Handle implicit hash tokens
      if (hash && hash.includes("access_token=")) {
        const p = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = p.get("access_token");
        const refresh_token = p.get("refresh_token");

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
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Confirm session
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        router.replace("/login?e=no_session");
      }
    }

    run();
  }, [router]);

  return <div style={{ padding: 24 }}>{msg}</div>;
}
