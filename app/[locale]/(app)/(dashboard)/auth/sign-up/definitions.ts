// https://nextjs.org/docs/app/guides/authentication

// import {
//   type CountryCode,
//   isSupportedCountry,
//   isValidPhoneNumber,
// } from "libphonenumber-js";
import { useTranslations } from "next-intl";
import * as z from "zod";

import { PASSWORD_MIN_LENGTH } from "@/constants/password";

// const today = dayjs();
// const minDate = dayjs("1900-01-01");

// type BirthDateError = "invalidDate" | "maxDate" | "minDate";

export const useSignUpFormSchema = () => {
  const tValidation = useTranslations("validation");
  // const birthDateMessageMap: Record<BirthDateError, string> = {
  //   invalidDate: dict.validation.birthDate.invalid,
  //   maxDate: dict.validation.birthDate.maxDate,
  //   minDate: dict.validation.birthDate.minDate,
  // };

  // const addBirthDateIssue = (ctx: z.RefinementCtx, type: BirthDateError) => {
  //   ctx.addIssue({
  //     code: "custom",
  //     message: birthDateMessageMap[type],
  //   });
  // };

  return z
    .object({
      image: z.string().trim().optional(),
      lastName: z.string().trim().optional(),
      firstName: z
        .string()
        .min(1, { error: tValidation("firstName.required") })
        .trim(),
      // birthDate: z
      //   .string()
      //   .min(1, { error: dict.validation.birthDate.required })
      //   .trim()
      //   .superRefine((value, ctx) => {
      //     const date = dayjs(value);

      //     if (!date.isValid()) addBirthDateIssue(ctx, "invalidDate");
      //     if (date.isAfter(today)) addBirthDateIssue(ctx, "maxDate");
      //     if (date.isBefore(minDate)) addBirthDateIssue(ctx, "minDate");
      //   }),
      // gender: z
      //   .union([z.enum(GENDER_VALUES), z.literal("")])
      //   .refine((value) => value !== "", {
      //     message: dict.validation.gender.required,
      //   }),
      email: z.email({ error: tValidation("email.invalid") }).trim(),
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, { error: tValidation("password.minLength") })
        .regex(/[a-zA-Z]/, { error: tValidation("password.letter") })
        .regex(/[0-9]/, { error: tValidation("password.number") })
        .trim(),
      confirmPassword: z
        .string()
        .min(1, { error: tValidation("confirmPassword.required") })
        .trim(),
      // country: z.object({
      //   code: z.custom<CountryCode>().superRefine((value, ctx) => {
      //     if (!value) {
      //       ctx.addIssue({
      //         code: "custom",
      //         message: dict.validation.countryCode.required,
      //       });
      //       return;
      //     }
      //     if (!isSupportedCountry(value)) {
      //       ctx.addIssue({
      //         code: "custom",
      //         message: dict.validation.countryCode.invalid,
      //       });
      //     }
      //   }),
      //   label: z.string(),
      //   phone: z.string(),
      //   firstLetter: z.string(),
      //   suggested: z.boolean().optional(),
      // }),
      // phoneNumber: z
      //   .string()
      //   .min(1, { error: dict.validation.phone.required })
      //   .trim(),
      emailSubscribed: z.boolean(),
    })
    .refine(({ password, confirmPassword }) => password === confirmPassword, {
      path: ["confirmPassword"],
      message: tValidation("confirmPassword.mismatch"),
    });
  // .refine(
  //   ({ country, phoneNumber }) => {
  //     return isValidPhoneNumber(phoneNumber, country.code);
  //   },
  //   { path: ["phoneNumber"], message: dict.validation.phone.invalid },
  // );
};

export type SignUpForm = z.infer<ReturnType<typeof useSignUpFormSchema>>;
