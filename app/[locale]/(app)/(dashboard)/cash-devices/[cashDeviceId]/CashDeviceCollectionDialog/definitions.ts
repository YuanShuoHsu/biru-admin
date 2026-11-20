import { useTranslations } from "next-intl";
import * as z from "zod";

export const useCashDeviceCollectionFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    depositedAmount: z.string().min(1, {
      error: tValidation("cashDeviceCollection.depositedAmount.required"),
    }),
    note: z.string().trim(),
    reportedAmount: z.string().min(1, {
      error: tValidation("cashDeviceCollection.reportedAmount.required"),
    }),
  });
};

export type CashDeviceCollectionForm = z.infer<
  ReturnType<typeof useCashDeviceCollectionFormSchema>
>;
