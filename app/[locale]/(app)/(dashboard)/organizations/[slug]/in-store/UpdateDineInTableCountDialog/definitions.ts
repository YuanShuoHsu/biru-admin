import { useTranslations } from "next-intl";
import * as z from "zod";

import { DINE_IN_MAX_TABLE_COUNT } from "@/constants/dineIn";

export const useDineInTableCountFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    dineInTableCount: z
      .string()
      .trim()
      .min(1, tValidation("dineInTableCount.required"))
      .refine(
        (value) => /^[1-9]\d*$/.test(value),
        tValidation("dineInTableCount.invalid"),
      )
      .refine(
        (value) => Number(value) <= DINE_IN_MAX_TABLE_COUNT,
        tValidation("dineInTableCount.max", { max: DINE_IN_MAX_TABLE_COUNT }),
      ),
  });
};

export type UpdateDineInTableCountForm = z.infer<
  ReturnType<typeof useDineInTableCountFormSchema>
>;
