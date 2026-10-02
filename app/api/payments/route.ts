import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";
import { initializePaystackTransaction } from "@/lib/paystack";
import { paymentSchema } from "@/lib/validators/payment";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { data, error } = await auth.supabase
      .from("payments")
      .select("*, invoice:invoices(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      payments: (data ?? []).map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    });
  } catch (error) {
    console.error("Payment fetch failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load payments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const parsed = paymentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, customerId, email, amount, reference } = parsed.data;
    const { data: order, error: orderError } = await auth.supabase
      .from("orders")
      .select("id, total, total_amount")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });

    const { data: invoice, error: invoiceError } = await auth.supabase
      .from("invoices")
      .upsert(
        {
          invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
          order_id: order.id,
          customer_id: customerId,
          status: "ISSUED",
          total: order.total || order.total_amount,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "order_id", ignoreDuplicates: true }
      )
      .select()
      .maybeSingle();
    if (invoiceError) throw invoiceError;

    const { data: existingInvoice, error: findInvoiceError } = invoice
      ? { data: invoice, error: null }
      : await auth.supabase.from("invoices").select("*").eq("order_id", order.id).single();
    if (findInvoiceError) throw findInvoiceError;
    const paymentReference = reference ?? `PAY-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

    const { data: existingPayment, error: existingError } = await auth.supabase
      .from("payments")
      .select("*")
      .eq("reference", paymentReference)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingPayment) {
      return NextResponse.json({
        success: true,
        payment: existingPayment,
        message: "Existing payment reference reused.",
      });
    }

    const { data: payment, error: paymentError } = await auth.supabase
      .from("payments")
      .insert({
        invoice_id: existingInvoice.id,
        amount,
        status: "PENDING",
        provider: "paystack",
        reference: paymentReference,
        metadata: { orderId, customerId, invoiceId: existingInvoice.id },
      })
      .select()
      .single();
    if (paymentError) throw paymentError;

    const paystackResponse = await initializePaystackTransaction({
      email,
      amount,
      reference: paymentReference,
      metadata: { orderId, customerId, invoiceId: existingInvoice.id },
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
