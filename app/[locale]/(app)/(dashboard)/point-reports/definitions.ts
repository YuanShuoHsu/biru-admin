import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { STORE_TIMEZONE } from "@/constants/timezone";

import {
  isReportMonth,
  MONTH_FORMAT,
} from "@/app/[locale]/(app)/(dashboard)/reports/definitions";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const resolvePointReportMonth = (month: string | undefined) =>
  isReportMonth(month)
    ? month
    : dayjs().tz(STORE_TIMEZONE).format(MONTH_FORMAT);
