import { useTranslations } from "next-intl";
import * as z from "zod";

export const PARTY_SIZE_MAX = 99;

export const getMinPartySize = (
  groups: { maxPartySize: string }[],
  index: number,
) => (index ? Number(groups[index - 1].maxPartySize) + 1 : 1);

export const useWaitlistFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      cutoffMinutes: z
        .string()
        .min(1, { error: tValidation("cutoffMinutes.required") })
        .refine((value) => Number.isInteger(Number(value)), {
          error: tValidation("number.integer"),
        }),
      enabled: z.boolean(),
      graceMinutes: z
        .string()
        .min(1, { error: tValidation("graceMinutes.required") })
        .refine((value) => Number.isInteger(Number(value)), {
          error: tValidation("number.integer"),
        }),
      groups: z
        .array(
          z.object({
            maxPartySize: z
              .string()
              .min(1, { error: tValidation("maxPartySize.required") })
              .refine((value) => Number.isInteger(Number(value)), {
                error: tValidation("number.integer"),
              })
              .refine((value) => Number(value) <= PARTY_SIZE_MAX, {
                error: tValidation("number.max", { max: PARTY_SIZE_MAX }),
              }),
          }),
        )
        .min(1),
      holdMinutes: z
        .string()
        .min(1, { error: tValidation("holdMinutes.required") })
        .refine((value) => Number.isInteger(Number(value)), {
          error: tValidation("number.integer"),
        }),
    })
    .superRefine(({ groups }, ctx) => {
      groups.forEach(({ maxPartySize }, index) => {
        if (
          maxPartySize &&
          Number(maxPartySize) < getMinPartySize(groups, index)
        )
          ctx.addIssue({
            code: "custom",
            message: tValidation("maxPartySize.belowMin"),
            path: ["groups", index, "maxPartySize"],
          });
      });
    });
};

export type UpdateWaitlistForm = z.infer<
  ReturnType<typeof useWaitlistFormSchema>
>;
