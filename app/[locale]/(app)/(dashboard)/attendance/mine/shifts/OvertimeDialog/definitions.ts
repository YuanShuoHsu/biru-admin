import { useTranslations } from "next-intl";
import * as z from "zod";

export const useOvertimeFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      startsAt: z.string().min(1, { error: tValidation("startsAt.required") }),
      endsAt: z.string().min(1, { error: tValidation("endsAt.required") }),
      reason: z
        .string()
        .trim()
        .min(1, { error: tValidation("reason.required") }),
    })
    .refine(({ endsAt, startsAt }) => new Date(endsAt) > new Date(startsAt), {
      error: tValidation("endsAt.afterStartsAt"),
      path: ["endsAt"],
    });
};

export type OvertimeForm = z.infer<ReturnType<typeof useOvertimeFormSchema>>;
