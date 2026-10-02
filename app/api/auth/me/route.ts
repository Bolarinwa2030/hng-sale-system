import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Invalid or expired token." }, { status: 401 });

    const { data: profile, error } = await auth.supabase
      .from("profiles")
      .select("first_name, last_name, phone, roles")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        firstName: profile?.first_name || auth.user.user_metadata.first_name || "",
        lastName: profile?.last_name || auth.user.user_metadata.last_name || "",
        phone: profile?.phone ?? auth.user.user_metadata.phone ?? null,
        roles: profile?.roles ?? ["Sales Staff"],
      },
    });
  } catch (error) {
    console.error("Supabase profile lookup failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load user profile." }, { status: 500 });
  }
}
