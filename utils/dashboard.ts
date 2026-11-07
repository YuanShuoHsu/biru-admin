import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { DASHBOARD_RANGES } from "@/app/[locale]/(app)/(dashboard)/dashboard/definitions";
import type { DashboardRange } from "@/app/[locale]/(app)/(dashboard)/dashboard/definitions";

import { PLATFORM_TIMEZONE, STORE_TIMEZONE } from "@/constants/timezone";

import type { OrderStatsResponse } from "@/types/orders";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const getChangePercent = (prev: number, recent: number): number => {
  if (prev === 0) return recent > 0 ? 100 : 0;

  return Math.round(((recent - prev) / prev) * 100);
};

export const sumOf = (values: number[]) =>
  values.reduce((sum, n) => sum + n, 0);

export const emptyWhenAllZero = <Row extends { count: number }>(
  rows: Row[],
): Row[] => (rows.some(({ count }) => count) ? rows : []);

export const toHourlyRows = (counts: number[]) =>
  emptyWhenAllZero(
    counts.map((count, hour) => ({ count, label: `${hour}:00` })),
  );

export const getDashboardPeriod = (range: DashboardRange) => {
  const { bucketUnit, bucketSize, buckets, offsetDays } =
    DASHBOARD_RANGES[range];

  const lastDay = dayjs()
    .tz(STORE_TIMEZONE)
    .startOf("day")
    .subtract(offsetDays, "day");

  const periodStart = (
    bucketUnit === "hour"
      ? lastDay
      : bucketUnit === "day"
        ? lastDay.subtract(buckets * bucketSize - 1, "day")
        : dayjs.tz(
            dayjs(lastDay.format("YYYY-MM-01"))
              .subtract((buckets - 1) * bucketSize, "month")
              .format("YYYY-MM-DD"),
            PLATFORM_TIMEZONE,
          )
  ).toDate();
  const periodEnd = lastDay.add(1, "day").toDate();

  const statsQuery = new URLSearchParams({
    since: periodStart.toISOString(),
    bucketUnit,
    bucketSize: String(bucketSize),
    bucketCount: String(buckets),
  });

  return { periodStart, periodEnd, statsQuery };
};

export const getMoneyTrend = (
  orderStats: OrderStatsResponse | null,
  key: "discount" | "revenue",
) => {
  const previous = orderStats?.previous[key];
  if (previous === undefined) return null;

  const data = (orderStats?.buckets ?? []).map((bucket) => bucket[key] ?? 0);

  return { data, percent: getChangePercent(previous, sumOf(data)) };
};
