import { useTranslations } from "next-intl";
import * as z from "zod";

import {
  getPickupMaxLeadMinutes,
  PICKUP_MAX_ADVANCE_DAYS,
  PICKUP_MAX_CUTOFF_MINUTES,
} from "@/constants/pickup";

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
      const advanceDays = Number(pickupMaxAdvanceDays);

      if (!pickupLeadMinutes)
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupLeadMinutes.required"),
          path: ["pickupLeadMinutes"],
        });
      else if (
        pickupMaxAdvanceDays &&
        advanceDays <= PICKUP_MAX_ADVANCE_DAYS &&
        Number(pickupLeadMinutes) > getPickupMaxLeadMinutes(advanceDays)
      )
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupLeadMinutes.max", {
            days: advanceDays + 1,
          }),
          path: ["pickupLeadMinutes"],
        });

      if (!pickupMaxAdvanceDays)
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupMaxAdvanceDays.required"),
          path: ["pickupMaxAdvanceDays"],
        });
      else if (advanceDays > PICKUP_MAX_ADVANCE_DAYS)
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
      else if (Number(pickupCutoffMinutes) > PICKUP_MAX_CUTOFF_MINUTES)
        ctx.addIssue({
          code: "custom",
          message: tValidation("pickupCutoffMinutes.max", {
            minutes: PICKUP_MAX_CUTOFF_MINUTES,
          }),
          path: ["pickupCutoffMinutes"],
        });
    });
};

export type UpdatePickupForm = z.infer<ReturnType<typeof usePickupFormSchema>>;
