import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/server-auth";
import { inventoryAdjustmentSchema } from "@/lib/validators/payment";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const [{ data: transactions, error: transactionError }, { data: products, error: productError }] =
      await Promise.all([
        auth.supabase
          .from("inventory_transactions")
          .select("*, product:products(*)")
          .order("created_at", { ascending: false }),
        auth.supabase.from("products").select("*").order("stock_quantity", { ascending: true }),
      ]);
    if (transactionError) throw transactionError;
    if (productError) throw productError;

    return NextResponse.json({
      success: true,
      transactions: transactions ?? [],
      lowStock: (products ?? []).filter((product) => product.stock_quantity <= product.min_stock_level),
    });
  } catch (error) {
    console.error("Inventory fetch failed:", error);
    return NextResponse.json({ success: false, message: "Unable to load inventory." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const parsed = inventoryAdjustmentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, quantity, type, reason, reference } = parsed.data;
    const { data, error } = await auth.supabase.rpc("adjust_inventory_stock", {
      p_product_id: productId,
      p_quantity: quantity,
      p_type: type,
      p_reason: reason,
      p_reference: reference || `${type}-${Date.now()}`,
    });
    if (error?.code === "P0002") {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }
    if (error?.code === "23514") {
      return NextResponse.json(
        { success: false, message: "Stock quantity is insufficient for this adjustment." },
        { status: 400 }
      );
    }
    if (error) throw error;
    if (!data || typeof data !== "object") {
      throw new Error("Supabase returned an invalid inventory adjustment result.");
    }

    return NextResponse.json({
      success: true,
      product: data.product,
      transaction: data.transaction,
    });
  } catch (error) {
    console.error("Inventory adjustment failed:", error);
    return NextResponse.json({ success: false, message: "Failed to update inventory." }, { status: 500 });
  }
}
