import { useTranslations } from "next-intl";
import * as z from "zod";

export const useAddTeamMemberFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    userId: z.string().min(1, { message: tValidation("member.required") }),
  });
};

export type AddTeamMemberForm = z.infer<
  ReturnType<typeof useAddTeamMemberFormSchema>
>;
