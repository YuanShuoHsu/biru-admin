import { useTranslations } from "next-intl";
import * as z from "zod";

export const useUpdatePointsFormSchema = () => {
  const tOrganizations = useTranslations("organizations");

  return z.object({
    amountPerPoint: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || Number(value) > 0,
        tOrganizations("points.amountPerPoint.invalid"),
      ),
    pointsValidityYears: z.string().trim(),
  });
};

export type UpdatePointsForm = z.infer<
  ReturnType<typeof useUpdatePointsFormSchema>
>;
