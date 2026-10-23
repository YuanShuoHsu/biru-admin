import { useTranslations } from "next-intl";
import * as z from "zod";

export const ADJUST_POINTS_LIMIT = 100000;

export const useAdjustPointsFormSchema = () => {
  const tOrganizations = useTranslations("organizations");
  const tValidation = useTranslations("validation");

  return z.object({
    email: z.email({ error: tValidation("email.invalid") }).trim(),
    points: z.string().refine(
      (value) => {
        const points = Number(value);

        return (
          value !== "" &&
          Number.isInteger(points) &&
          points !== 0 &&
          Math.abs(points) <= ADJUST_POINTS_LIMIT
        );
      },
      tOrganizations("points.adjust.points.invalid", {
        limit: ADJUST_POINTS_LIMIT,
      }),
    ),
    note: z
      .string()
      .trim()
      .min(1, tOrganizations("points.adjust.note.required")),
  });
};

export type AdjustPointsForm = z.infer<
  ReturnType<typeof useAdjustPointsFormSchema>
>;
