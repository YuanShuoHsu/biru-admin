import { useTranslations } from "next-intl";
import * as z from "zod";

export const BAN_EXPIRES_OPTIONS = [
  { value: 0, label: "permanent" },
  { value: 31536000, label: "1year" },
  { value: 7776000, label: "90days" },
  { value: 2592000, label: "30days" },
  { value: 604800, label: "7days" },
  { value: 86400, label: "1day" },
  { value: 43200, label: "12hours" },
  { value: 3600, label: "1hour" },
] as const;

export const useBanUserFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    banExpiresIn: z.coerce.number(),
    banReason: z.string(),
  });
};

export type BanUserFormInput = z.input<ReturnType<typeof useBanUserFormSchema>>;

export type BanUserFormOutput = z.output<
  ReturnType<typeof useBanUserFormSchema>
>;
