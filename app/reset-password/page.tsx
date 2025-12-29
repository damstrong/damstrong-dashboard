"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // If user landed here without a recovery session, bounce to login
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({ password });

    setBusy(false);

    if (error) return setMsg(error.message);

    setMsg("Password updated. Redirecting…");
    setTimeout(() => router.replace("/"), 800);
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Set a new password</h1>
      <form onSubmit={onSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />
        <button
          disabled={busy || password.length < 8}
          style={{ width: "100%", padding: 12, borderRadius: 8, background: "black", color: "white" }}
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
