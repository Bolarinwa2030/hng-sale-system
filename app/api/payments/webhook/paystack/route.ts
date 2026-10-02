import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getSupabaseServiceClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ success: false, message: "Paystack secret missing." }, { status: 500 });
    }

    const expected = createHmac("sha512", secret).update(payload).digest("hex");
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json({ success: false, message: "Invalid webhook signature." }, { status: 401 });
    }

    const eventPayload = JSON.parse(payload);
    if (eventPayload.event !== "charge.success") {
      return NextResponse.json({ success: true, ignored: true });
    }

    const { reference, amount, metadata, id } = eventPayload.data;
    const supabase = getSupabaseServiceClient();
    const { data: payment, error: paymentLookupError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .maybeSingle();
    if (paymentLookupError) throw paymentLookupError;
    if (!payment) {
      return NextResponse.json({ success: true, ignored: true, message: "Unknown payment reference." });
    }
    if (payment.status === "SUCCESS") return NextResponse.json({ success: true, idempotent: true });

    const paymentMetadata =
      metadata && typeof metadata === "object"
        ? metadata
        : payment.metadata;
    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "SUCCESS",
        provider_ref: id ? String(id) : null,
        webhook_event: eventPayload.event,
        amount: Number(amount) / 100,
        metadata: paymentMetadata,
      })
      .eq("id", payment.id);
    if (updatePaymentError) throw updatePaymentError;

    const orderId =
      paymentMetadata && typeof paymentMetadata === "object" && "orderId" in paymentMetadata
        ? String(paymentMetadata.orderId)
        : null;
    if (orderId) {
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "paid", payment_status: "paid" })
        .eq("id", orderId);
      if (orderError) throw orderError;

      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: "PAID" })
        .eq("order_id", orderId);
      if (invoiceError) throw invoiceError;
    } else {
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: "PAID" })
        .eq("id", payment.invoice_id);
      if (invoiceError) throw invoiceError;
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error) {
    console.error("Paystack webhook failed:", error);
    return NextResponse.json({ success: false, message: "Webhook processing failed." }, { status: 500 });
  }
}
