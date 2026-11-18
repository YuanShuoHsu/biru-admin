import {
  isReportMonth,
  MONTH_FORMAT,
  storeToday,
} from "@/app/[locale]/(app)/(dashboard)/reports/definitions";

export const resolvePointReportMonth = (month: string | undefined) =>
  isReportMonth(month) ? month : storeToday().format(MONTH_FORMAT);
