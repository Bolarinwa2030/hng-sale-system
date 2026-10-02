import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { invoiceSchema } from "@/lib/validators/invoice";

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

    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        order: true,
      },
      orderBy: { issuedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      invoices: invoices.map((invoice) => ({
        ...invoice,
        total: Number(invoice.total),
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
    const parsed = invoiceSchema.safeParse(body);

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

    const { orderId, customerId, dueDate, status } = parsed.data;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        customerId,
        status: status ?? "ISSUED",
        total: order.total,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        customer: true,
        order: true,
      },
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create invoice." }, { status: 500 });
  }
}
