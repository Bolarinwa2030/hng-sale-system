import { createBrowserSupabaseClient, hasSupabaseConfiguration } from "@/lib/supabase";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!hasSupabaseConfiguration()) return {};

  const { data, error } = await createBrowserSupabaseClient().auth.getSession();
  if (error) throw error;
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}
