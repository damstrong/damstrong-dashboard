"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function isAllowedEmail(email: string, allowedCsv: string | undefined) {
  if (!allowedCsv) return true;
  const allowed = allowedCsv
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.length === 0 || allowed.includes(email.toLowerCase());
}

export default function HomePage() {
  const allowedCsv = process.env.NEXT_PUBLIC_ALLOWED_EMAILS; // optional, see note below
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [notAllowed, setNotAllowed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const e = data.session?.user?.email ?? null;
      setEmail(e);
      if (e && !isAllowedEmail(e, allowedCsv)) setNotAllowed(true);
      setLoading(false);
    });
  }, [allowedCsv]);

  const title = useMemo(() => {
    if (loading) return "Loading…";
    if (!email) return "Not signed in";
    if (notAllowed) return "Access denied";
    return "Damstrong Dashboard";
  }, [loading, email, notAllowed]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  if (!email) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>
        <p style={{ marginTop: 8 }}>You’re not signed in.</p>
        <p style={{ marginTop: 12 }}>
          <Link href="/login">Go to login</Link>
        </p>
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>
        <p style={{ marginTop: 8 }}>
          Signed in as <b>{email}</b>, but this account isn’t on the allowlist.
        </p>
        <p style={{ marginTop: 12 }}>
          <Link href="/login">Back to login</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{title}</h1>
      <p style={{ marginTop: 8 }}>Signed in as {email}</p>
      <p style={{ marginTop: 12 }}>
        Next: wire the charts + CSV uploads.
      </p>
    </div>
  );
}
