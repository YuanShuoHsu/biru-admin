import * as z from "zod";

export const transactionFormSchema = z.object({
  inventoryLevel: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export type TransactionFormInput = z.input<typeof transactionFormSchema>;

export type TransactionFormOutput = z.output<typeof transactionFormSchema>;
