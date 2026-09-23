import { useTranslations } from "next-intl";
import * as z from "zod";

export const useEmployeeFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      userId: z.string(),
      hiredAt: z.string().min(1, { error: tValidation("hiredAt.required") }),
      terminatedAt: z.string(),
      enabled: z.boolean(),
    })
    .refine(
      ({ hiredAt, terminatedAt }) =>
        !terminatedAt || new Date(terminatedAt) > new Date(hiredAt),
      {
        error: tValidation("terminatedAt.afterHiredAt"),
        path: ["terminatedAt"],
      },
    );
};

export type EmployeeForm = z.infer<ReturnType<typeof useEmployeeFormSchema>>;
