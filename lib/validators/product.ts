import { z } from "zod";

export const productSchema = z.object({
  sku: z.string().min(2).max(80),
  name: z.string().min(2).max(150),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.string().min(1).max(80).optional().or(z.literal("")),
  sellingPrice: z.number().min(0),
  costPrice: z.number().min(0),
  stockQuantity: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(0),
  unit: z.string().max(50).optional().or(z.literal("")),
  status: z.string().max(50).optional().or(z.literal("ACTIVE")),
});
