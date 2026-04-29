import { useTranslations } from "next-intl";
import * as z from "zod";

import { roles } from "@/constants/organizations";

export const useInviteMemberFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    role: z
      .string()
      .pipe(z.enum(roles, { error: tValidation("role.required") })),
    teamId: z.string().trim().optional(),
  });
};

export type InviteMemberFormInput = z.input<
  ReturnType<typeof useInviteMemberFormSchema>
>;

export type InviteMemberFormOutput = z.output<
  ReturnType<typeof useInviteMemberFormSchema>
>;
