import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";

const sampleProducts = [
  {
    sku: "IT-1001",
    name: "Business Laptop Pro",
    description: "High-performance laptop for business users.",
    category: "Electronics",
    price: 780000,
    selling_price: 780000,
    cost_price: 620000,
    stock_quantity: 18,
    min_stock_level: 5,
    unit: "unit",
    status: "ACTIVE",
    is_active: true,
  },
  {
    sku: "IT-1002",
    name: "Premium Office Chair",
    description: "Ergonomic chair for office operations.",
    category: "Furniture",
    price: 52500,
    selling_price: 52500,
    cost_price: 37000,
    stock_quantity: 42,
    min_stock_level: 10,
    unit: "unit",
    status: "ACTIVE",
    is_active: true,
  },
  {
    sku: "NW-2001",
    name: "Network Router 5G",
    description: "Secure business router for connectivity.",
    category: "Networking",
    price: 176400,
    selling_price: 176400,
    cost_price: 120000,
    stock_quantity: 9,
    min_stock_level: 6,
    unit: "unit",
    status: "ACTIVE",
    is_active: true,
  },
];

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { error } = await auth.supabase.from("products").upsert(sampleProducts, { onConflict: "sku" });
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Sample products created successfully." });
  } catch (error) {
    console.error("Supabase seed failed:", error);
    return NextResponse.json({ success: false, message: "Seed data failed." }, { status: 500 });
  }
}
