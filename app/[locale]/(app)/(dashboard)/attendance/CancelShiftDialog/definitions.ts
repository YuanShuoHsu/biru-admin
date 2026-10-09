import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCancelShiftFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    reason: z
      .string()
      .trim()
      .min(1, { error: tValidation("cancelReason.required") }),
  });
};

export type CancelShiftForm = z.infer<
  ReturnType<typeof useCancelShiftFormSchema>
>;
