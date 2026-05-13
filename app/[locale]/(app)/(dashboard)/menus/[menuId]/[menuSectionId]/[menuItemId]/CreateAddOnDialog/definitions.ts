import * as z from "zod";

export const ADD_ON_TYPE_VALUES = ["item", "section"] as const;

export const useCreateAddOnFormSchema = () => {
  return z
    .object({
      type: z.enum(ADD_ON_TYPE_VALUES),
      sectionId: z.string().min(1),
      addOnMenuItemId: z.string().optional(),
      addOnMenuSectionId: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === "item" && !data.addOnMenuItemId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["addOnMenuItemId"],
          message: "Required",
        });
      }
      if (data.type === "section" && !data.addOnMenuSectionId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["addOnMenuSectionId"],
          message: "Required",
        });
      }
    });
};

export type CreateAddOnForm = z.infer<ReturnType<typeof useCreateAddOnFormSchema>>;
