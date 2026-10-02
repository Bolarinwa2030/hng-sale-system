import { NextResponse } from "next/server";

import { verifyAccessToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { productSchema } from "@/lib/validators/product";

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

    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      products: products.map((product) => ({
        ...product,
        sellingPrice: Number(product.sellingPrice),
        costPrice: Number(product.costPrice),
      })),
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
    const parsed = productSchema.safeParse(body);

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

    const data = parsed.data;

    const product = await prisma.product.upsert({
      where: { sku: data.sku },
      update: {
        name: data.name,
        description: data.description || null,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel,
        unit: data.unit || "unit",
        status: data.status || "ACTIVE",
      },
      create: {
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice,
        stockQuantity: data.stockQuantity,
        minStockLevel: data.minStockLevel,
        unit: data.unit || "unit",
        status: data.status || "ACTIVE",
        category: data.category
          ? {
              connectOrCreate: {
                where: { name: data.category },
                create: { name: data.category },
              },
            }
          : undefined,
      },
      include: { category: true },
    });

    return NextResponse.json(
      {
        success: true,
        product: {
          ...product,
          sellingPrice: Number(product.sellingPrice),
          costPrice: Number(product.costPrice),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create or update product." }, { status: 500 });
  }
}
