import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const [orders, invoices, products, payments] = await Promise.all([
      prisma.order.findMany({ include: { customer: true } }),
      prisma.invoice.findMany({ include: { customer: true } }),
      prisma.product.findMany({ orderBy: { stockQuantity: "asc" } }),
      prisma.payment.findMany({ include: { invoice: true } }),
    ]);

    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const paidInvoices = invoices.filter((invoice) => invoice.status === "PAID").length;
    const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
    const totalPayments = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const lowStock = products.filter((product) => product.stockQuantity <= product.minStockLevel);

    return NextResponse.json({
      success: true,
      summary: {
        totalSales,
        paidInvoices,
        overdueInvoices,
        totalPayments,
        lowStockCount: lowStock.length,
      },
      lowStock,
      recentOrders: orders.slice(0, 5).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer.name,
        total: Number(order.total),
        status: order.status,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid or expired token." }, { status: 401 });
  }
}
