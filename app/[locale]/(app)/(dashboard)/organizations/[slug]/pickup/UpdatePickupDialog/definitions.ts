import { useTranslations } from "next-intl";
import * as z from "zod";

import { PICKUP_MAX_ADVANCE_DAYS } from "@/constants/pickup";

export const usePickupFormSchema = () => {
  const tValidation = useTranslations("validation");

  const nonNegativeInteger = (invalid: string) =>
    z
      .string()
      .trim()
      .refine((value) => !value || /^\d+$/.test(value), invalid);

  return z
    .object({
      pickupCutoffMinutes: nonNegativeInteger(
        tValidation("pickupCutoffMinutes.invalid"),
      ),
      pickupLeadMinutes: nonNegativeInteger(
        tValidation("pickupLeadMinutes.invalid"),
      ),
      pickupMaxAdvanceDays: nonNegativeInteger(
        tValidation("pickupMaxAdvanceDays.invalid"),
      ),
    })
    .superRefine((data, ctx) => {
      const { pickupCutoffMinutes, pickupLeadMinutes, pickupMaxAdvanceDays } =
        data;

      if (!pickupLeadMinutes)
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupLeadMinutes.required"),
          path: ["pickupLeadMinutes"],
        });

      if (!pickupMaxAdvanceDays)
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupMaxAdvanceDays.required"),
          path: ["pickupMaxAdvanceDays"],
        });
      else if (Number(pickupMaxAdvanceDays) > PICKUP_MAX_ADVANCE_DAYS)
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupMaxAdvanceDays.max", {
            days: PICKUP_MAX_ADVANCE_DAYS,
          }),
          path: ["pickupMaxAdvanceDays"],
        });

      if (!pickupCutoffMinutes)
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupCutoffMinutes.required"),
          path: ["pickupCutoffMinutes"],
        });
    });
};

export type UpdatePickupForm = z.infer<ReturnType<typeof usePickupFormSchema>>;
