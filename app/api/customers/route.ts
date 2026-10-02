import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { customerSchema } from "@/lib/validators/customer";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.replace("Bearer ", "") : "";
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await verifyAccessToken(token);

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: true,
      },
    });

    return NextResponse.json({
      success: true,
      customers: customers.map((customer) => ({
        ...customer,
        ordersCount: customer.orders.length,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid or expired token." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await verifyAccessToken(token);

    const body = await request.json();
    const parsed = customerSchema.safeParse(body);

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

    const data = parsed.data;
    const customerCode = `CUST-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        companyName: data.companyName || null,
        customerType: data.customerType || "INDIVIDUAL",
        notes: data.notes || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create customer." }, { status: 500 });
  }
}
