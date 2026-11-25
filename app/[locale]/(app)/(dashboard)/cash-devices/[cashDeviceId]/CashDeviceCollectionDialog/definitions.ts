import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCashDeviceCollectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      depositedAmount: z
        .string()
        .min(1, {
          error: tValidation("cashDeviceCollection.depositedAmount.required"),
        })
        .refine((amount) => Number(amount) <= 9_999_999, {
          error: tValidation("cashDeviceCollection.depositedAmount.max"),
        }),
      note: z
        .string()
        .trim()
        .max(500, { error: tValidation("cashDeviceEventNote.maxLength") }),
      reportedAmount: z
        .string()
        .min(1, {
          error: tValidation("cashDeviceCollection.reportedAmount.required"),
        })
        .refine((amount) => Number(amount) <= 9_999_999, {
          error: tValidation("cashDeviceCollection.reportedAmount.max"),
        }),
    })
    .refine(
      ({ depositedAmount, reportedAmount }) =>
        Number(depositedAmount) > 0 || Number(reportedAmount) > 0,
      {
        error: tValidation("cashDeviceCollection.empty"),
        path: ["depositedAmount"],
      },
    );
};

export type CashDeviceCollectionForm = z.infer<
  ReturnType<typeof useCashDeviceCollectionFormSchema>
>;
