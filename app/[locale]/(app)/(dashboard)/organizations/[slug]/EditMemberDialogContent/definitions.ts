import { useTranslations } from "next-intl";
import * as z from "zod";

export const roles = ["owner", "admin", "member"] as const;

export const useEditMemberFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    role: z
      .string()
      .pipe(z.enum(roles, { error: tValidation("role.required") })),
  });
};

export type EditMemberFormInput = z.input<
  ReturnType<typeof useEditMemberFormSchema>
>;

export type EditMemberFormOutput = z.output<
  ReturnType<typeof useEditMemberFormSchema>
>;
