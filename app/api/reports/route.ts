import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const [ordersResult, invoicesResult, productsResult, paymentsResult] = await Promise.all([
      auth.supabase.from("orders").select("*, customer:customers(name)").order("created_at", { ascending: false }),
      auth.supabase.from("invoices").select("*"),
      auth.supabase.from("products").select("*").order("stock_quantity", { ascending: true }),
      auth.supabase.from("payments").select("*"),
    ]);
    for (const result of [ordersResult, invoicesResult, productsResult, paymentsResult]) {
      if (result.error) throw result.error;
    }

    const orders = ordersResult.data ?? [];
    const invoices = invoicesResult.data ?? [];
    const products = productsResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const lowStock = products.filter((product) => product.stock_quantity <= product.min_stock_level);

    return NextResponse.json({
      success: true,
      summary: {
        totalSales: orders.reduce((sum, order) => sum + Number(order.total || order.total_amount), 0),
        paidInvoices: invoices.filter((invoice) => invoice.status === "PAID").length,
        overdueInvoices: invoices.filter((invoice) => invoice.status === "OVERDUE").length,
        totalPayments: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
        lowStockCount: lowStock.length,
      },
      lowStock,
      recentOrders: orders.slice(0, 5).map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        customer: order.customer?.name ?? order.customer_name,
        total: Number(order.total || order.total_amount),
        status: order.status,
      })),
    });
  } catch (error) {
    console.error("Report generation failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load reports." }, { status: 500 });
  }
}
