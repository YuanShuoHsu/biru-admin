import { useLocale } from "next-intl";

import { LocaleEnum } from "@/enums/Locale";

import type { Locale } from "@/i18n/routing";

const monthFormats: Record<Locale, string> = {
  [LocaleEnum.ZhTW]: "YYYY/MM",
  [LocaleEnum.En]: "MM/YYYY",
  [LocaleEnum.Ja]: "YYYY/MM",
  [LocaleEnum.Ko]: "YYYY.MM.",
  [LocaleEnum.ZhCN]: "YYYY/MM",
};

export const useMonthFormat = () => monthFormats[useLocale()];
