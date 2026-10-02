import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { signAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "Database is not configured. Add DATABASE_URL to your environment.",
        },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((entry) => entry.role.name),
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.roles.map((entry) => entry.role.name),
      },
    });
  } catch (error) {
    console.error("User login failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login failed.",
      },
      { status: 500 }
    );
  }
}
