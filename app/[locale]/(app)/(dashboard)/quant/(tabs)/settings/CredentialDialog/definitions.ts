import { useTranslations } from "next-intl";
import * as z from "zod";

const LABEL_MAX_LENGTH = 50;

export const useCredentialFormSchema = () => {
  const tQuant = useTranslations("quant");

  const required = z
    .string()
    .trim()
    .min(1, { error: tQuant("order.validation.required") });

  return z.object({
    apiKey: required,
    apiSecret: required,
    label: required.max(LABEL_MAX_LENGTH),
  });
};

export type CredentialForm = z.infer<
  ReturnType<typeof useCredentialFormSchema>
>;
