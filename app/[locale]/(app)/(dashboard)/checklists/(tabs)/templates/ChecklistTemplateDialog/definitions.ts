import { useTranslations } from "next-intl";
import * as z from "zod";

import { checklistItemTypeValues, checklistTimingValues } from "@/types/api";

export const ITEMS_MAX = 50;
export const MEASUREMENT_LIMIT = 99999;

export const useChecklistTemplateFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    enabled: z.boolean(),
    items: z
      .array(
        z
          .object({
            itemId: z.string().optional(),
            label: z
              .string()
              .trim()
              .min(1, { error: tValidation("checklistItemLabel.required") })
              .max(100, { error: tValidation("checklistItemLabel.maxLength") }),
            maxValue: z.string(),
            minValue: z.string(),
            type: z.enum(checklistItemTypeValues),
            unit: z.string().trim().max(10),
          })
          .superRefine(({ maxValue, minValue, type }, ctx) => {
            if (type !== "number") return;

            for (const [path, value] of [
              ["minValue", minValue],
              ["maxValue", maxValue],
            ])
              if (value && !/^-?\d+(\.\d{1,2})?$/.test(value))
                ctx.addIssue({
                  code: "custom",
                  message: tValidation("number.maxFractionDigits", {
                    digits: 2,
                  }),
                  path: [path],
                });

            if (minValue && maxValue && Number(minValue) > Number(maxValue))
              ctx.addIssue({
                code: "custom",
                message: tValidation("checklistItemRange.order"),
                path: ["maxValue"],
              });
          }),
      )
      .max(ITEMS_MAX),
    name: z
      .string()
      .trim()
      .min(1, { error: tValidation("checklistTemplateName.required") })
      .max(50, { error: tValidation("checklistTemplateName.maxLength") }),
    timing: z.enum(checklistTimingValues),
  });
};

export type ChecklistTemplateForm = z.infer<
  ReturnType<typeof useChecklistTemplateFormSchema>
>;
