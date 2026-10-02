import { NextResponse } from "next/server";

import { getSupabaseServiceClient } from "@/lib/supabase-server";

function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.replace("Bearer ", "") : "";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

async function sendOrderConfirmationEmail(payload: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; total: number }>;
  totalAmount: number;
  paymentStatus?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "Resend is not configured." };
  }

  const itemRows = payload.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0; text-align:center;">${item.quantity}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0; text-align:right;">${formatMoney(item.unitPrice)}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0; text-align:right;">${formatMoney(item.total)}</td>
        </tr>`
    )
    .join("");

  const paymentStatus = payload.paymentStatus ?? "Paid";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;background:#f8fafc;padding:32px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;background:#fef3c7;color:#92400e;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Mariam Market</div>
        </div>
        <h2 style="margin:0 0 8px;color:#0f172a;">Thank you, ${payload.customerName}.</h2>
        <p style="margin:0 0 16px;color:#475569;">Your order <strong>${payload.orderNumber}</strong> was received on ${payload.orderDate}.</p>

        <div style="margin-bottom:12px;padding:12px 16px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;color:#065f46;font-weight:600;">
          Payment status: ${paymentStatus}
        </div>

        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:12px 16px;text-align:left;">Item</th>
              <th style="padding:12px 16px;text-align:center;">Qty</th>
              <th style="padding:12px 16px;text-align:right;">Unit price</th>
              <th style="padding:12px 16px;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div style="display:flex;justify-content:space-between;padding-top:16px;border-top:1px solid #e2e8f0;font-weight:700;">
          <span>Total</span>
          <span>${formatMoney(payload.totalAmount)}</span>
        </div>

        <p style="margin-top:24px;color:#475569;">We will keep you updated as your order moves along.</p>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: `Order confirmation: ${payload.orderNumber}`,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend request failed: ${errorText}`);
  }

  const result: { id?: string } = await response.json();
  return { sent: true, id: result.id };
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, message: "Invalid or expired session." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, orders: data ?? [] });
  } catch (error) {
    console.error("Order fetch failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load orders." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, message: "Invalid or expired session." }, { status: 401 });
    }

    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json({ success: false, message: "Your cart is empty." }, { status: 400 });
    }

    if (!body.customerName || !body.customerEmail) {
      return NextResponse.json({ success: false, message: "Customer information is required." }, { status: 400 });
    }

    const totalAmount = items.reduce((sum: number, item: { quantity: number; price: number }) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);

    const orderNumber = `MKT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
    const orderDate = new Date().toISOString();

    const orderStatus = typeof body.paymentStatus === "string" && body.paymentStatus ? body.paymentStatus : "paid";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: authData.user.id,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone || "",
        customer_address: body.customerAddress || "",
        total_amount: totalAmount,
        status: orderStatus,
        payment_status: orderStatus === "paid" ? "paid" : "pending",
        created_at: orderDate,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw orderError ?? new Error("Order creation failed.");
    }

    const rowData = items.map((item: { id?: string; product_id?: string; name: string; price: number; quantity: number }) => {
      const rawProductId = item.product_id ?? item.id ?? "";
      const validProductId = typeof rawProductId === "string" && /^[0-9a-fA-F-]{36}$/.test(rawProductId) ? rawProductId : null;

      return {
        order_id: order.id,
        product_id: validProductId,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: Number(item.price),
        total_price: Number(item.price) * Number(item.quantity),
      };
    });

    const { error: itemError } = await supabase.from("order_items").insert(rowData);
    if (itemError) {
      throw itemError;
    }

    const mailResult = await sendOrderConfirmationEmail({
      to: body.customerEmail,
      customerName: body.customerName,
      orderNumber,
      orderDate: new Date(orderDate).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      items: items.map((item: { name: string; quantity: number; price: number }) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        total: Number(item.price) * Number(item.quantity),
      })),
      totalAmount,
      paymentStatus: orderStatus,
    });

    return NextResponse.json({
      success: true,
      message: "Order saved successfully.",
      order,
      mailResult,
    });
  } catch (error) {
    console.error("Checkout failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Checkout failed.",
      },
      { status: 500 }
    );
  }
}
