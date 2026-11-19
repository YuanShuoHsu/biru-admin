import { useTranslations } from "next-intl";
import * as z from "zod";

import { cashDeviceStatusValues } from "@/types/api";

export const useCashDeviceFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    model: z
      .string()
      .trim()
      .max(100, { error: tValidation("cashDeviceModel.maxLength") }),
    name: z
      .string()
      .trim()
      .min(1, { error: tValidation("cashDeviceName.required") })
      .max(50, { error: tValidation("cashDeviceName.maxLength") }),
    status: z.enum(cashDeviceStatusValues),
    vendor: z
      .string()
      .trim()
      .max(100, { error: tValidation("cashDeviceVendor.maxLength") }),
  });
};

export type CashDeviceForm = z.infer<
  ReturnType<typeof useCashDeviceFormSchema>
>;
