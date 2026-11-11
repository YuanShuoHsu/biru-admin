import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import * as z from "zod";

import { PLATFORM_TIMEZONE } from "@/constants/timezone";

import {
  hasIncompleteOpeningHours,
  hasOpeningHoursConflict,
} from "@/utils/openingHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const useSpecialHoursFormSchema = () => {
  const tValidation = useTranslations("validation");

  return z
    .object({
      closed: z.boolean(),
      note: z
        .string()
        .trim()
        .max(50, { error: tValidation("note.maxLength") }),
      openingHours: z.string().trim(),
      validFrom: z
        .string()
        .min(1, { error: tValidation("validFrom.required") }),
      validThrough: z
        .string()
        .min(1, { error: tValidation("validThrough.required") }),
    })
    .superRefine(({ closed, openingHours, validFrom, validThrough }, ctx) => {
      if (validThrough && validFrom && validThrough < validFrom)
        ctx.addIssue({
          code: "custom",
          message: tValidation("validFrom.order"),
          path: ["validThrough"],
        });
      else if (
        validThrough &&
        validThrough < dayjs().tz(PLATFORM_TIMEZONE).format("YYYY-MM-DD")
      )
        ctx.addIssue({
          code: "custom",
          message: tValidation("validThrough.ended"),
          path: ["validThrough"],
        });

      if (closed) return;

      if (!openingHours)
        ctx.addIssue({
          code: "custom",
          message: tValidation("openingHours.required"),
          path: ["openingHours"],
        });
      else if (
        hasIncompleteOpeningHours(openingHours) ||
        hasOpeningHoursConflict(openingHours)
      )
        ctx.addIssue({ code: "custom", path: ["openingHours"] });
    });
};

export type SpecialHoursForm = z.infer<
  ReturnType<typeof useSpecialHoursFormSchema>
>;
