import { type CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { useTranslations } from "next-intl";
import * as z from "zod";

export const useAddWaitlistTicketFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      countryCode: z
        .string()
        .min(1, { error: tValidation("countryCode.notSelected") }),
      email: z.union([
        z.literal(""),
        z.email({ error: tValidation("email.invalid") }),
      ]),
      name: z
        .string()
        .trim()
        .min(1, { error: tValidation("name.required") }),
      partySize: z
        .string()
        .min(1, { error: tValidation("partySize.notSelected") }),
      telephone: z
        .string()
        .trim()
        .min(1, { error: tValidation("telephone.required") }),
    })
    .superRefine((data, ctx) => {
      if (
        data.telephone &&
        !isValidPhoneNumber(data.telephone, data.countryCode as CountryCode)
      )
        ctx.addIssue({
          code: "custom",
          message: tValidation("telephone.invalid"),
          path: ["telephone"],
        });
    });
};

export type AddWaitlistTicketForm = z.infer<
  ReturnType<typeof useAddWaitlistTicketFormSchema>
>;
