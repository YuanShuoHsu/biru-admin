import { useTranslations } from "next-intl";
import * as z from "zod";

import { userSearchFieldValues, userSearchOperatorValues } from "@/types/api";

export const useSearchFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    searchField: z.enum(userSearchFieldValues, {
      error: tValidation("searchField.required"),
    }),
    searchOperator: z.enum(userSearchOperatorValues),
    searchValue: z.string(),
  });
};

export type SearchForm = z.infer<ReturnType<typeof useSearchFormSchema>>;
