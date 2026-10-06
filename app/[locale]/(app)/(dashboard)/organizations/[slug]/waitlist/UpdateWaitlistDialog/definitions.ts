import { useTranslations } from "next-intl";
import * as z from "zod";

export const getMinPartySize = (
  groups: { maxPartySize: string }[],
  index: number,
) => (index ? Number(groups[index - 1].maxPartySize) + 1 : 1);

export const useWaitlistFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      enabled: z.boolean(),
      groups: z
        .array(
          z.object({
            maxPartySize: z
              .string()
              .min(1, { error: tValidation("maxPartySize.required") }),
            prefix: z
              .string()
              .min(1, { error: tValidation("prefix.required") })
              .regex(/^[A-Z]$/, { error: tValidation("prefix.invalid") }),
          }),
        )
        .min(1),
      holdMinutes: z
        .string()
        .min(1, { error: tValidation("holdMinutes.required") }),
    })
    .superRefine(({ groups }, ctx) => {
      groups.forEach(({ maxPartySize, prefix }, index) => {
        if (
          maxPartySize &&
          Number(maxPartySize) < getMinPartySize(groups, index)
        )
          ctx.addIssue({
            code: "custom",
            message: tValidation("maxPartySize.belowMin"),
            path: ["groups", index, "maxPartySize"],
          });

        if (groups.findIndex((group) => group.prefix === prefix) !== index)
          ctx.addIssue({
            code: "custom",
            message: tValidation("prefix.duplicate"),
            path: ["groups", index, "prefix"],
          });
      });
    });
};

export type UpdateWaitlistForm = z.infer<
  ReturnType<typeof useWaitlistFormSchema>
>;
