import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.replace("Bearer ", "")
      : "";

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing bearer token.",
        },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: String(payload.sub) },
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
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        roles: user.roles.map((entry) => entry.role.name),
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired token.",
      },
      { status: 401 }
    );
  }
}
