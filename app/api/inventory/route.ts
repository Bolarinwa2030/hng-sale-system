import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { inventoryAdjustmentSchema } from "@/lib/validators/payment";

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

    const [transactions, products] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        orderBy: { createdAt: "desc" },
        include: { product: true },
      }),
      prisma.product.findMany({
        orderBy: { stockQuantity: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      transactions,
      lowStock: products.filter((product) => product.stockQuantity <= product.minStockLevel),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Invalid or expired token." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await verifyAccessToken(token);

    const body = await request.json();
    const parsed = inventoryAdjustmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { productId, quantity, type, reason, reference } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found." }, { status: 404 });
    }

    let nextStock = product.stockQuantity;

    if (type === "OUT" && product.stockQuantity < quantity) {
      return NextResponse.json({ success: false, message: "Stock quantity is insufficient for this adjustment." }, { status: 400 });
    }

    if (type === "IN" || type === "ADJUSTMENT") {
      nextStock = product.stockQuantity + quantity;
    }

    if (type === "OUT") {
      nextStock = product.stockQuantity - quantity;
    }

    const [updatedProduct, transaction] = await Promise.all([
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: nextStock },
      }),
      prisma.inventoryTransaction.create({
        data: {
          productId,
          type,
          quantity,
          reason,
          reference: reference || `${type}-${Date.now()}`,
        },
      }),
    ]);

    return NextResponse.json({ success: true, product: updatedProduct, transaction });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update inventory." }, { status: 500 });
  }
}
