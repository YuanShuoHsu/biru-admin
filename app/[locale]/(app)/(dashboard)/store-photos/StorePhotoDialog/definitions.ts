import { useTranslations } from "next-intl";
import * as z from "zod";

import { refineRequiredLocalizedText } from "@/utils/locale";

export const useStorePhotoFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    alt: z
      .record(
        z.string(),
        z
          .string()
          .trim()
          .max(160, {
            error: tValidation("localizedText.maxLength", { max: 160 }),
          }),
      )
      .superRefine(
        refineRequiredLocalizedText(tValidation("localizedText.required")),
      ),
    isActive: z.boolean(),
  });
};

export type StorePhotoForm = z.infer<
  ReturnType<typeof useStorePhotoFormSchema>
>;
