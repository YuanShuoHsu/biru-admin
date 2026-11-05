import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { salesReportGroupByValues } from "@/types/api";
import type { SalesReportGroupBy } from "@/types/reports";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const MAX_RANGE_DAYS = 366;

export const DATE_FORMAT = "YYYY-MM-DD";

export const REPORT_TABS = ["sales", "inventory"] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

export interface ReportView {
  groupBy: SalesReportGroupBy;
  since: string;
  tab: ReportTab;
  until: string;
}

export const toStoreDate = (date: string) => dayjs.tz(date, STORE_TIMEZONE);

export const storeToday = () => dayjs().tz(STORE_TIMEZONE).startOf("day");

const isStoreDate = (value: string | undefined): value is string =>
  !!value &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  toStoreDate(value).format(DATE_FORMAT) === value;

export const isValidRange = (since: string, until: string) => {
  const start = toStoreDate(since);
  const end = toStoreDate(until);

  return (
    !end.isBefore(start, "day") &&
    end.diff(start, "day") < MAX_RANGE_DAYS &&
    !end.isAfter(storeToday(), "day")
  );
};

export const resolveReportView = (
  {
    groupBy,
    since,
    tab,
    until,
  }: { groupBy?: string; since?: string; tab?: string; until?: string },
  tabs: readonly ReportTab[],
): ReportView => {
  const today = storeToday();
  const hasRange =
    isStoreDate(since) && isStoreDate(until) && isValidRange(since, until);

  return {
    groupBy:
      salesReportGroupByValues.find((value) => value === groupBy) ?? "day",
    since: hasRange ? since : today.startOf("month").format(DATE_FORMAT),
    tab: tabs.find((value) => value === tab) ?? tabs[0],
    until: hasRange ? until : today.format(DATE_FORMAT),
  };
};

export const getReportQuery = ({ groupBy, since, tab, until }: ReportView) =>
  new URLSearchParams({
    since: toStoreDate(since).format(),
    until: toStoreDate(until).add(1, "day").format(),
    ...(tab === "sales" && { groupBy }),
  }).toString();

export const getReportPath = (organizationSlug: string, tab: ReportTab) =>
  `/api/organizations/${organizationSlug}/reports/${tab}`;
