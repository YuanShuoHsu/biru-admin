import { useTranslations } from "next-intl";
import * as z from "zod";

export const useChildFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z.object({
    birthDate: z.string().min(1, { error: tValidation("birthDate.required") }),
    employeeId: z
      .string()
      .min(1, { error: tValidation("employee.notSelected") }),
    label: z
      .string()
      .trim()
      .min(1, { error: tValidation("childLabel.required") }),
    reference: z
      .string()
      .trim()
      .min(1, { error: tValidation("childReference.required") }),
  });
};

export type ChildForm = z.infer<ReturnType<typeof useChildFormSchema>>;
