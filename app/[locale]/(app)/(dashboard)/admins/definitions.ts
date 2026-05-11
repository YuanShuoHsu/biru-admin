import { useTranslations } from "next-intl";
import * as z from "zod";

import { SEARCH_FIELDS, SEARCH_OPERATORS } from "./constants";

export const useSearchFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    searchField: z.enum(SEARCH_FIELDS, {
      error: tValidation("searchField.required"),
    }),
    searchOperator: z.enum(SEARCH_OPERATORS),
    searchValue: z.string(),
  });
};

export type SearchForm = z.infer<ReturnType<typeof useSearchFormSchema>>;
