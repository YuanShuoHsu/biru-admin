import { useTranslations } from "next-intl";
import * as z from "zod";

import { roles } from "../CreateUserDialogContent/definitions";

export const useSetRoleFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    role: z
      .string()
      .pipe(z.enum(roles, { error: tValidation("role.required") })),
  });
};

export type SetRoleFormInput = z.input<
  ReturnType<typeof useSetRoleFormSchema>
>;

export type SetRoleFormOutput = z.output<
  ReturnType<typeof useSetRoleFormSchema>
>;
