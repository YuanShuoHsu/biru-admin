import { useTranslations } from "next-intl";
import * as z from "zod";

export const TWO_FACTOR_METHOD = {
  BACKUP_CODE: "backupCode",
  OTP: "otp",
  TOTP: "totp",
} as const;

export type TwoFactorMethod =
  (typeof TWO_FACTOR_METHOD)[keyof typeof TWO_FACTOR_METHOD];

export const useTwoFactorFormSchema = (method: TwoFactorMethod) => {
  const tValidation = useTranslations("validation");

  return z.object({
    code:
      method === TWO_FACTOR_METHOD.BACKUP_CODE
        ? z
            .string()
            .trim()
            .min(1, { error: tValidation("backupCode.required") })
        : z
            .string()
            .overwrite((code) => code.replace(/\s/g, ""))
            .regex(/^\d{6}$/, { error: tValidation("twoFactorCode.invalid") }),
    trustDevice: z.boolean(),
  });
};

export type TwoFactorForm = z.infer<ReturnType<typeof useTwoFactorFormSchema>>;
