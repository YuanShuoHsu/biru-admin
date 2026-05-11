import { useTranslations } from "next-intl";
import * as z from "zod";

export const searchFields = ["name", "email"] as const;

export const useSearchFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    searchField: z.enum(searchFields, {
      error: tValidation("searchField.required"),
    }),
    searchValue: z.string(),
  });
};

export type SearchForm = z.infer<ReturnType<typeof useSearchFormSchema>>;
