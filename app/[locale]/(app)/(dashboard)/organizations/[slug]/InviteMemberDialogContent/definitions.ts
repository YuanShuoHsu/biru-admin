import { useTranslations } from "next-intl";
import * as z from "zod";

export const roles = ["owner", "admin", "member"] as const;

export const useInviteMemberFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    role: z
      .string()
      .pipe(z.enum(roles, { error: tValidation("role.required") })),
  });
};

export type InviteMemberFormInput = z.input<
  ReturnType<typeof useInviteMemberFormSchema>
>;

export type InviteMemberFormOutput = z.output<
  ReturnType<typeof useInviteMemberFormSchema>
>;
