import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";
import { customerSchema } from "@/lib/validators/customer";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { data, error } = await auth.supabase
      .from("customers")
      .select("*, orders(id)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({
      success: true,
      customers: (data ?? []).map(({ orders, ...customer }) => ({
        ...customer,
        customerCode: customer.customer_code,
        companyName: customer.company_name,
        customerType: customer.customer_type,
        createdAt: customer.created_at,
        ordersCount: orders.length,
      })),
    });
  } catch (error) {
    console.error("Customer fetch failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load customers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const parsed = customerSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const { data: customer, error } = await auth.supabase
      .from("customers")
      .insert({
        customer_code: `CUST-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        company_name: data.companyName || null,
        customer_type: data.customerType || "INDIVIDUAL",
        notes: data.notes || null,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    console.error("Customer creation failed:", error);
    return NextResponse.json({ success: false, message: "Failed to create customer." }, { status: 500 });
  }
}
