import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";

export async function seedRolesAndUsers() {
  const roles = [
    { name: "Super Admin", description: "Full access to all system settings and data." },
    { name: "Administrator", description: "Business operations and management access." },
    { name: "Sales Staff", description: "Create sales orders and customers." },
    { name: "Accountant", description: "View payments, finance, and money movement." },
    { name: "Inventory Manager", description: "Manage products and inventory volume." },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: "Super Admin" } });
  if (!adminRole) return;

  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@salesflow.ng" },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "admin@salesflow.ng",
        passwordHash: await bcrypt.hash("Admin@12345", 12),
        firstName: "System",
        lastName: "Admin",
        phone: "+2348000000000",
        status: "ACTIVE",
        isEmailVerified: true,
        roles: {
          create: [{ roleId: adminRole.id }],
        },
      },
    });
  }
}

export async function seedSampleProducts() {
  const products = [
    {
      sku: "IT-1001",
      name: "Business Laptop Pro",
      description: "High-performance laptop for business users.",
      sellingPrice: 780000,
      costPrice: 620000,
      stockQuantity: 18,
      minStockLevel: 5,
      unit: "unit",
      status: "ACTIVE",
      categoryName: "Electronics",
    },
    {
      sku: "IT-1002",
      name: "Premium Office Chair",
      description: "Ergonomic chair for office operations.",
      sellingPrice: 52500,
      costPrice: 37000,
      stockQuantity: 42,
      minStockLevel: 10,
      unit: "unit",
      status: "ACTIVE",
      categoryName: "Furniture",
    },
    {
      sku: "NW-2001",
      name: "Network Router 5G",
      description: "Secure business router for connectivity.",
      sellingPrice: 176400,
      costPrice: 120000,
      stockQuantity: 9,
      minStockLevel: 6,
      unit: "unit",
      status: "ACTIVE",
      categoryName: "Networking",
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        description: product.description,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        unit: product.unit,
        status: product.status,
      },
      create: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        unit: product.unit,
        status: product.status,
        category: {
          connectOrCreate: {
            where: { name: product.categoryName },
            create: { name: product.categoryName },
          },
        },
      },
    });
  }
}
