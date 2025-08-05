// https://nextjs.org/docs/app/building-your-application/routing/internationalization#localization

import "server-only";

import type { LocaleCode } from "@/types/locale";

export const dictionaries = {
  "zh-TW": () =>
    import("./dictionaries/zh-TW.json").then((module) => module.default),
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  ja: () => import("./dictionaries/ja.json").then((module) => module.default),
  ko: () => import("./dictionaries/ko.json").then((module) => module.default),
  "zh-CN": () =>
    import("./dictionaries/zh-CN.json").then((module) => module.default),
};

export const getDictionary = async (locale: LocaleCode) =>
  dictionaries[locale]();
