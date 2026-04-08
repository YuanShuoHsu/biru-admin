import { useTranslations } from "next-intl";
import * as z from "zod";

import { roles } from "@/constants/organizations";

export const useUpdateMemberRoleFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    role: z
      .string()
      .pipe(z.enum(roles, { error: tValidation("role.required") })),
  });
};

export type UpdateMemberRoleFormInput = z.input<
  ReturnType<typeof useUpdateMemberRoleFormSchema>
>;

export type UpdateMemberRoleFormOutput = z.output<
  ReturnType<typeof useUpdateMemberRoleFormSchema>
>;
