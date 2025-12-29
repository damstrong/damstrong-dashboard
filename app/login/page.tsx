"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = useMemo(() => params.get("next") || "/", [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ NEW: handle Supabase PKCE email links: /login?code=...
  useEffect(() => {
    async function handleCodeExchange() {
      const code = params.get("code");
      if (!code) return;

      setBusy(true);
      setMsg(null);

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      // Clean URL so refresh doesn't keep trying
      window.history.replaceState({}, document.title, window.location.pathname);

      setBusy(false);

      if (error) {
        setMsg(error.message);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    }

    handleCodeExchange();
  }, [params, router, nextPath]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Damstrong Dashboard Login
      </h1>

      <form onSubmit={onLogin} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <input
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
        />
        <button
          disabled={busy}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #000",
            background: busy ? "#ddd" : "#000",
            color: "#fff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {msg && (
        <p style={{ color: "crimson", marginTop: 10, whiteSpace: "pre-wrap" }}>
          {msg}
        </p>
      )}

      <p style={{ marginTop: 16, color: "#666", fontSize: 12 }}>
        Access restricted to approved accounts.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}
