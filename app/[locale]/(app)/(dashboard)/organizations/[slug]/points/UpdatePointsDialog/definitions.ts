import * as z from "zod";

export const updatePointsFormSchema = z.object({
  amountPerPoint: z.string().trim(),
  pointsValidityYears: z.string().trim(),
});

export type UpdatePointsForm = z.infer<typeof updatePointsFormSchema>;
