import { type CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdateOrderCustomerFormSchema = () => {
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
      remark: z
        .string()
        .trim()
        .max(160, { error: tValidation("remark.maxLength") }),
      telephone: z.string().trim(),
    })
    .superRefine((data, ctx) => {
      if (
        data.telephone &&
        !isValidPhoneNumber(data.telephone, data.countryCode as CountryCode)
      ) {
        ctx.addIssue({
          code: "custom",
          message: tValidation("telephone.invalid"),
          path: ["telephone"],
        });
      }
    });
};

export type UpdateOrderCustomerForm = z.infer<
  ReturnType<typeof useUpdateOrderCustomerFormSchema>
>;
