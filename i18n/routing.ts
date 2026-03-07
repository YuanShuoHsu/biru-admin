// https://next-intl.dev/docs/routing/setup

import { defineRouting } from "next-intl/routing";

import { LocaleEnum } from "@/enums/Locale";

export const routing = defineRouting({
  defaultLocale: LocaleEnum.ZhTW,
  locales: [
    LocaleEnum.ZhTW,
    LocaleEnum.En,
    LocaleEnum.Ja,
    LocaleEnum.Ko,
    LocaleEnum.ZhCN,
  ],
});

export type Locale = (typeof routing.locales)[number];
