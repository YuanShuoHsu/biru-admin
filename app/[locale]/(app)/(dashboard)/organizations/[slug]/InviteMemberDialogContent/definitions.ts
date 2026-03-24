import { useTranslations } from "next-intl";
import * as z from "zod";

export const useInviteMemberFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    role: z.enum(["admin", "member"]),
  });
};

export type InviteMemberForm = z.infer<
  ReturnType<typeof useInviteMemberFormSchema>
>;
