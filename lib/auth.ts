export function getAllowedEmails(): Set<string> {
  const raw = process.env.ALLOWED_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAllowedEmail(email?: string | null) {
  if (!email) return false;
  return getAllowedEmails().has(email.toLowerCase());
}
