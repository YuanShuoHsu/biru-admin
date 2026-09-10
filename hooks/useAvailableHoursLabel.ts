import { useTranslations } from "next-intl";

import { formatOpeningHoursForDisplay } from "@/utils/openingHours";

export const useAvailableHoursLabel = () => {
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  return (availableHours: string | null | undefined) =>
    availableHours
      ? tOrder("menuItem.availableHours", {
          value: formatOpeningHoursForDisplay(availableHours, {
            formatDay: (day) => tCommon(`location.openingHours.${day}`),
            formatNextDayTime: (time) =>
              tCommon("location.openingHours.nextDayTime", { time }),
            allDayLabel: tCommon("location.openingHours.allDay"),
            rangeSeparator: tCommon("location.openingHours.rangeSeparator"),
            delimiter: tCommon("delimiter"),
          }).join(tCommon("delimiter")),
        })
      : "";
};
