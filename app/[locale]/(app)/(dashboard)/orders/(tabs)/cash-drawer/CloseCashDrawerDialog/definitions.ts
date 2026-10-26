import { useTranslations } from "next-intl";
import * as z from "zod";

import { toCents, useCashAmountSchema } from "../CashAmountField/definitions";

export const exceedsTolerance = (
  countedCash: string,
  expectedCash: string,
  varianceTolerance: string,
) =>
  Math.abs(toCents(countedCash) - toCents(expectedCash)) >
  toCents(varianceTolerance);

export const useCloseCashDrawerFormSchema = (
  expectedCash: string,
  varianceTolerance: string,
) => {
  const tValidation = useTranslations("validation");

  const cashAmountSchema = useCashAmountSchema();

  return z
    .object({
      countedCash: cashAmountSchema,
      retainedFloat: cashAmountSchema,
      varianceNote: z.string().trim(),
    })
    .refine(
      ({ countedCash, retainedFloat }) =>
        toCents(retainedFloat) <= toCents(countedCash),
      {
        error: tValidation("retainedFloat.exceedsCounted"),
        path: ["retainedFloat"],
      },
    )
    .refine(
      ({ countedCash, varianceNote }) =>
        varianceNote !== "" ||
        !exceedsTolerance(countedCash, expectedCash, varianceTolerance),
      {
        error: tValidation("varianceNote.required"),
        path: ["varianceNote"],
      },
    );
};

export type CloseCashDrawerForm = z.infer<
  ReturnType<typeof useCloseCashDrawerFormSchema>
>;
