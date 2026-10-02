import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(7).max(30).optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  companyName: z.string().max(150).optional().or(z.literal("")),
  customerType: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});
