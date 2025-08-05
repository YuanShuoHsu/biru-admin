import { createContext, useContext } from "react";

import { dictionaries } from "@/app/[lang]/dictionaries";

export type I18nDict = Awaited<ReturnType<(typeof dictionaries)["zh-TW"]>>;

const I18nContext = createContext<I18nDict | null>(null);

export const useI18n = () => useContext(I18nContext)!;

export default I18nContext;
