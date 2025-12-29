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

  // ✅ If we landed here from a Supabase magic link, it arrives as:
  // /login#access_token=...&refresh_token=...&type=magiclink
  // Consume it, set session, and redirect.
  useEffect(() => {
    async function consumeMagicLinkHash() {
      try {
        const hash = window.location.hash;
        if (!hash || !hash.includes("access_token=")) return;

        const p = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = p.get("access_token");
        const refresh_token = p.get("refresh_token");

        if (!access_token || !refresh_token) return;

        setBusy(true);
        setMsg(null);

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        // Clean URL so it doesn't keep re-processing on refresh
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname + window.location.search
        );

        setBusy(false);

        if (error) {
          setMsg(error.message);
          return;
        }

        router.replace(nextPath);
        router.refresh();
      } catch (e: any) {
        setBusy(false);
        setMsg(e?.message || "Failed to consume magic link.");
      }
    }

    consumeMagicLinkHash();
  }, [router, nextPath]);

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

  async function onForgotPassword() {
    if (!email) {
      setMsg("Enter your email first.");
      return;
    }

    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Keep it simple: send them back to /login with tokens in hash;
      // this page now consumes them.
      redirectTo: `${window.location.origin}/login`,
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Password reset email sent. Check your inbox.");
  }

  async function onMagicLink() {
    if (!email) {
      setMsg("Enter your email first.");
      return;
    }

    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Magic link sent. Check your inbox.");
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

        <button
          type="button"
          onClick={onForgotPassword}
          disabled={busy}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #000",
            background: "#fff",
            color: "#000",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Forgot password
        </button>

        <button
          type="button"
          onClick={onMagicLink}
          disabled={busy}
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #000",
            background: "#fff",
            color: "#000",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Email me a magic link
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
