import { NextResponse } from "next/server";

import { getSupabaseAuthClient } from "@/lib/supabase";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, phone } = parsed.data;
    const { data, error } = await getSupabaseAuthClient().auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone: phone || "" },
      },
    });
    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: !data.session,
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }
        : null,
      user: data.user,
    }, { status: 201 });
  } catch (error) {
    console.error("Supabase registration failed:", error);
    return NextResponse.json({ success: false, message: "Unable to register." }, { status: 500 });
  }
}
