import { NextResponse } from "next/server";

import { getSupabaseAuthClient } from "@/lib/supabase";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseAuthClient().auth.signInWithPassword(parsed.data);
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 401 });
    }
    if (!data.session || !data.user) {
      return NextResponse.json({ success: false, message: "No active session was created." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
      user: data.user,
    });
  } catch (error) {
    console.error("Supabase sign-in failed:", error);
    return NextResponse.json({ success: false, message: "Unable to sign in." }, { status: 500 });
  }
}
