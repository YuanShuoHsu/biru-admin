import { useTranslations } from "next-intl";
import * as z from "zod";

export const useSubstituteFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    shiftId: z.string().min(1, { error: tValidation("shift.notSelected") }),
  });
};

export type SubstituteForm = z.infer<
  ReturnType<typeof useSubstituteFormSchema>
>;
