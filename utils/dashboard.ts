import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { STORE_TIMEZONE } from "@/constants/timezone";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const getBinnedValueBuckets = (
  entries: { date: string | Date; value: number }[],
  bucketCount: number,
  bucketSizeDays: number,
  endDate = new Date(),
): number[] => {
  const buckets = Array(bucketCount).fill(0);
  const end = dayjs(endDate).tz(STORE_TIMEZONE).startOf("day");

  for (const { date: entryDate, value } of entries) {
    const day = dayjs(entryDate).tz(STORE_TIMEZONE).startOf("day");
    const diffDays = end.diff(day, "day");
    const index = bucketCount - 1 - Math.floor(diffDays / bucketSizeDays);

    if (index >= 0 && index < bucketCount) buckets[index] += value;
  }

  return buckets;
};

export const getBinnedBuckets = (
  createdAts: (string | Date)[],
  bucketCount: number,
  bucketSizeDays: number,
  endDate = new Date(),
): number[] =>
  getBinnedValueBuckets(
    createdAts.map((date) => ({ date, value: 1 })),
    bucketCount,
    bucketSizeDays,
    endDate,
  );

export const getHourlyValueBuckets = (
  entries: { date: string | Date; value: number }[],
  bucketCount: number,
  startDate: Date,
): number[] => {
  const buckets = Array(bucketCount).fill(0);
  const start = startDate.getTime();

  for (const { date, value } of entries) {
    const index = Math.floor((new Date(date).getTime() - start) / 3_600_000);

    if (index >= 0 && index < bucketCount) buckets[index] += value;
  }

  return buckets;
};

export const getHourlyBuckets = (
  createdAts: (string | Date)[],
  bucketCount: number,
  startDate: Date,
): number[] =>
  getHourlyValueBuckets(
    createdAts.map((date) => ({ date, value: 1 })),
    bucketCount,
    startDate,
  );

export const getTrendPercent = (buckets: number[]): number => {
  const half = Math.floor(buckets.length / 2);
  const prev = buckets.slice(0, half).reduce((sum, n) => sum + n, 0);
  const recent = buckets.slice(half).reduce((sum, n) => sum + n, 0);

  if (prev === 0) return recent > 0 ? 100 : 0;

  return Math.round(((recent - prev) / prev) * 100);
};
