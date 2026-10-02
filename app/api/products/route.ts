import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";
import { getSupabaseAuthClient } from "@/lib/supabase";
import { productSchema } from "@/lib/validators/product";

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatProduct(product: Record<string, unknown>) {
  const name = String(product.name ?? "");
  const stockQuantity = Number(product.stock_quantity ?? 0);
  const minStockLevel = Number(product.min_stock_level ?? 0);
  const specs = Array.isArray(product.specs)
    ? product.specs.flatMap((spec) => {
        if (!spec || typeof spec !== "object") return [];
        const value = spec as Record<string, unknown>;
        return typeof value.label === "string" && typeof value.value === "string"
          ? [{ label: value.label, value: value.value }]
          : [];
      })
    : [];
  return {
    id: String(product.id),
    sku: String(product.sku ?? ""),
    slug: String(product.slug || makeSlug(name)),
    name,
    category: String(product.category ?? "Essentials"),
    description: String(product.description ?? ""),
    shortDescription: String(product.short_description ?? product.description ?? ""),
    price: Number(product.price ?? product.selling_price ?? 0),
    oldPrice: product.old_price == null ? undefined : Number(product.old_price),
    rating: Number(product.rating ?? 0),
    reviews: Number(product.reviews ?? 0),
    badge: product.badge ? String(product.badge) : undefined,
    inStock: stockQuantity > 0,
    stockLabel: stockQuantity <= 0 ? "Out of stock" : stockQuantity <= minStockLevel ? "Low stock" : "In stock",
    image: String(
      product.image_url ??
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80"
    ),
    sellingPrice: Number(product.selling_price),
    costPrice: Number(product.cost_price),
    stockQuantity,
    minStockLevel,
    createdAt: product.created_at,
    specs,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    const supabase = auth?.supabase ?? getSupabaseAuthClient();
    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!auth) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, products: (data ?? []).map(formatProduct) });
  } catch (error) {
    console.error("Product fetch failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const parsed = productSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const { data: product, error } = await auth.supabase
      .from("products")
      .upsert(
        {
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          category: data.category || null,
          slug: makeSlug(data.name),
          short_description: data.description || null,
          selling_price: data.sellingPrice,
          cost_price: data.costPrice,
          price: data.sellingPrice,
          stock_quantity: data.stockQuantity,
          min_stock_level: data.minStockLevel,
          unit: data.unit || "unit",
          status: data.status || "ACTIVE",
          is_active: (data.status || "ACTIVE") === "ACTIVE",
        },
        { onConflict: "sku" }
      )
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, product: formatProduct(product) }, { status: 201 });
  } catch (error) {
    console.error("Product upsert failed:", error);
    return NextResponse.json({ success: false, message: "Failed to create or update product." }, { status: 500 });
  }
}
