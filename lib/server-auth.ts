import type { SupabaseClient, User } from "@supabase/supabase-js";

import { getSupabaseServiceClient } from "@/lib/supabase-server";

export async function getAuthenticatedUser(request: Request): Promise<{
  supabase: SupabaseClient;
  user: User;
} | null> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return { supabase, user: data.user };
}
