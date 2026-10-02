import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      return NextResponse.json({ success: false, message: "Paystack secret missing." }, { status: 500 });
    }

    const expectedSignature = createHmac("sha512", secret).update(payload).digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ success: false, message: "Invalid webhook signature." }, { status: 401 });
    }

    const eventPayload = JSON.parse(payload);
    const event = eventPayload.event;

    if (!event || event !== "charge.success") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const { reference, amount, metadata } = eventPayload.data;
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { invoice: true },
    });

    if (!payment) {
      return NextResponse.json({ success: true, ignored: true, message: "Unknown payment reference." });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ success: true, idempotent: true });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        providerRef: eventPayload.data.id ? String(eventPayload.data.id) : null,
        webhookEvent: event,
        amount: Number(amount) / 100,
        metadata: metadata ? JSON.stringify(metadata) : payment.metadata,
      },
    });

    let orderId: string | null = null;

    if (metadata && typeof metadata === "object" && "orderId" in metadata) {
      orderId = String((metadata as { orderId?: string }).orderId ?? null);
    }

    if (!orderId && payment.metadata) {
      try {
        const parsedMetadata = JSON.parse(payment.metadata);
        orderId = parsedMetadata?.orderId ? String(parsedMetadata.orderId) : null;
      } catch {
        orderId = null;
      }
    }

    if (orderId) {
      await prisma.order.update({
        where: { id: String(orderId) },
        data: { status: "PAID" },
      });

      const invoice = await prisma.invoice.findFirst({
        where: { orderId: String(orderId) },
      });

      if (invoice) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "PAID" },
        });
      }
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error) {
    console.error("Paystack webhook failed:", error);
    return NextResponse.json({ success: false, message: "Webhook processing failed." }, { status: 500 });
  }
}
