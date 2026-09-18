import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import * as z from "zod";

export const useGenerateFormSchema = () => {
  const tValidation = useTranslations("validation");

  const isValidDate = (value: string) => dayjs(value).isValid();

  return z
    .object({
      templateId: z
        .string()
        .min(1, { error: tValidation("template.notSelected") }),
      from: z
        .string()
        .refine(isValidDate, { error: tValidation("startDate.invalid") }),
      to: z
        .string()
        .refine(isValidDate, { error: tValidation("endDate.invalid") }),
    })
    .refine(({ from, to }) => !dayjs(to).isBefore(dayjs(from)), {
      error: tValidation("endDate.beforeStartDate"),
      path: ["to"],
    });
};

export type GenerateForm = z.infer<ReturnType<typeof useGenerateFormSchema>>;
