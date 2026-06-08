import { useTranslations } from "next-intl";
import * as z from "zod";

export const useAttachModifierGroupFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    modifierGroupId: z
      .string()
      .min(1, { error: tValidation("modifierGroupId.required") }),
  });
};

export type AttachModifierGroupForm = z.infer<
  ReturnType<typeof useAttachModifierGroupFormSchema>
>;
