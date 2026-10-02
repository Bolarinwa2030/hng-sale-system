import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";
import { invoiceSchema } from "@/lib/validators/invoice";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { data, error } = await auth.supabase
      .from("invoices")
      .select("*, customer:customers(*), order:orders(*)")
      .order("issued_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      invoices: (data ?? []).map((invoice) => ({
        ...invoice,
        invoiceNumber: invoice.invoice_number,
        dueDate: invoice.due_date,
        issuedAt: invoice.issued_at,
        total: Number(invoice.total),
      })),
    });
  } catch (error) {
    console.error("Invoice fetch failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load invoices." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const parsed = invoiceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { orderId, customerId, dueDate, status } = parsed.data;
    const { data: order, error: orderError } = await auth.supabase
      .from("orders")
      .select("id, total, total_amount")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });

    const { data: invoice, error } = await auth.supabase
      .from("invoices")
      .insert({
        invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        order_id: orderId,
        customer_id: customerId,
        status: status ?? "ISSUED",
        total: order.total || order.total_amount,
        due_date: dueDate || null,
      })
      .select("*, customer:customers(*), order:orders(*)")
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    console.error("Invoice creation failed:", error);
    return NextResponse.json({ success: false, message: "Failed to create invoice." }, { status: 500 });
  }
}
