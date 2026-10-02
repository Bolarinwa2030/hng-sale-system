import { z } from "zod";

export const paymentSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().min(1),
  email: z.string().email(),
  amount: z.number().positive(),
  reference: z.string().min(1).optional(),
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  reason: z.string().min(1).max(250),
  reference: z.string().optional().or(z.literal("")),
});
