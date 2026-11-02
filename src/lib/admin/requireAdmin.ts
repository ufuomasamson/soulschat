import { fetchIsAdmin } from "@/lib/admin/queries";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login?next=/admin");

  const isAdmin = await fetchIsAdmin(supabase, userId);
  if (!isAdmin) redirect("/chats");

  return { supabase, userId };
}
