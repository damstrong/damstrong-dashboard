import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAllowedEmail } from "@/lib/auth";

export default async function Home() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isAllowedEmail(user.email)) redirect("/login");

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Damstrong Dashboard</h1>
      <p>Logged in as: {user.email}</p>
      <p style={{ marginTop: 12 }}>
        Next: build Contacts/Leads table + click-through detail view.
      </p>
    </main>
  );
}
