import { useLocale } from "next-intl";

import { localeConfigs } from "@/constants/locale";

export const useMonthFormat = () => localeConfigs[useLocale()].monthFormat;
