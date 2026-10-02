import { z } from "zod";

export const invoiceSchema = z.object({
  orderId: z.string().min(1),
  customerId: z.string().min(1),
  dueDate: z.string().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "ISSUED", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"]).optional(),
});
