import { createContext, useContext } from "react";

import en from "@/app/[lang]/dictionaries/en.json";
import ja from "@/app/[lang]/dictionaries/ja.json";
import ko from "@/app/[lang]/dictionaries/ko.json";
import zhCN from "@/app/[lang]/dictionaries/zh-CN.json";
import zhTW from "@/app/[lang]/dictionaries/zh-TW.json";

export type I18nDict =
  | typeof zhTW
  | typeof zhCN
  | typeof en
  | typeof ja
  | typeof ko;

const I18nContext = createContext<I18nDict | null>(null);

export const useI18n = () => useContext(I18nContext)!;

export default I18nContext;
