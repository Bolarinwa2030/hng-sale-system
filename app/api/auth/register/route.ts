import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { signAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

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

    const { firstName, lastName, email, password, phone } = parsed.data;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message: "Database is not configured. Add DATABASE_URL to your environment.",
        },
        { status: 500 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const defaultRole = await prisma.role.upsert({
      where: { name: "Sales Staff" },
      update: {},
      create: {
        name: "Sales Staff",
        description: "Default sales user role",
      },
    });

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        passwordHash: await bcrypt.hash(password, 12),
        roles: {
          create: [{ roleId: defaultRole.id }],
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const token = await signAccessToken({
      sub: user.id,
      email: user.email,
      roles: user.roles.map((entry) => entry.role.name),
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("User registration failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Registration failed.",
      },
      { status: 500 }
    );
  }
}
