import { useTranslations } from "next-intl";
import * as z from "zod";

import { userRoleValues } from "@/types/api";

export const useSetRoleFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    role: z
      .string()
      .pipe(z.enum(userRoleValues, { error: tValidation("role.required") })),
  });
};

export type SetRoleFormInput = z.input<ReturnType<typeof useSetRoleFormSchema>>;

export type SetRoleFormOutput = z.output<
  ReturnType<typeof useSetRoleFormSchema>
>;
