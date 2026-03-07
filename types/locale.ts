import dayjs from "dayjs";
import type { CountryCode } from "libphonenumber-js";

import type { ThemeOptions } from "@mui/material/styles";

import type { EcpayLanguage } from "@/types/ecpay/createEcpayDto";

export interface LocaleConfig {
  countryCode: CountryCode;
  dayjs: ReturnType<typeof dayjs.locale>;
  ecpay: EcpayLanguage;
  label: string;
  mui: ThemeOptions[];
}
