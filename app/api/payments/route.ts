import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { initializePaystackTransaction } from "@/lib/paystack";
import { paymentSchema } from "@/lib/validators/payment";

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

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: { invoice: true },
    });

    return NextResponse.json({
      success: true,
      payments: payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
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
    const parsed = paymentSchema.safeParse(body);

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

    const { orderId, customerId, email, amount, reference } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { invoice: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const paymentReference = reference ?? `PAY-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    let invoice = order.invoice;

    if (!invoice) {
      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
          orderId: order.id,
          customerId,
          status: "ISSUED",
          total: order.total,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    const existingPayment = await prisma.payment.findUnique({
      where: { reference: paymentReference },
    });

    if (existingPayment) {
      return NextResponse.json({ success: true, payment: existingPayment, message: "Existing payment reference reused." });
    }

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        status: "PENDING",
        provider: "paystack",
        reference: paymentReference,
        metadata: JSON.stringify({ orderId, customerId, invoiceId: invoice.id }),
      },
    });

    const paystackResponse = await initializePaystackTransaction({
      email,
      amount,
      reference: paymentReference,
      metadata: {
        orderId,
        customerId,
        invoiceId: invoice.id,
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      authorizationUrl: paystackResponse.authorization_url,
      reference: paymentReference,
    });
  } catch (error) {
    console.error("Payment initialization failed:", error);
    return NextResponse.json({ success: false, message: "Failed to initialize payment." }, { status: 500 });
  }
}
