import { z } from "zod";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const orderSchema = z.object({
  customerId: z.string().min(1),
  notes: z.string().max(1000).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "PAID", "PARTIALLY_PAID", "CANCELLED", "REFUNDED"]).optional(),
  items: z.array(orderItemSchema).min(1),
});
