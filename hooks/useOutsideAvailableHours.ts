"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useParams } from "next/navigation";

import { ORDER_MODE } from "@/constants/orderMode";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useOrganization } from "@/hooks/organizations";

import type { RouteParams } from "@/types/routeParams";

import { isOpenAt } from "@/utils/openingHours";
import type { PickupWindow } from "@/utils/pickup";
import {
  getPickupWindow,
  hasPickupTimeInWindow,
  isStorePickupTime,
} from "@/utils/pickup";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const RESULT_CACHE_LIMIT = 64;
const resultCache = new Map<string, boolean>();

const isOutsidePickupWindow = (
  pickupWindow: PickupWindow,
  availableHours: string,
): boolean => {
  const { cutoffMinutes, from, openingHours, to } = pickupWindow;
  const key = `${from.valueOf()}|${to.valueOf()}|${cutoffMinutes}|${openingHours}|${availableHours}`;

  const cached = resultCache.get(key);
  if (cached !== undefined) return cached;

  const result = !hasPickupTimeInWindow(
    pickupWindow,
    (at) => isOpenAt(availableHours, at) && isStorePickupTime(pickupWindow, at),
  );
  resultCache.set(key, result);

  if (resultCache.size > RESULT_CACHE_LIMIT) {
    const oldest = resultCache.keys().next().value;
    if (oldest !== undefined) resultCache.delete(oldest);
  }

  return result;
};

export const useOutsideAvailableHours = () => {
  const { mode } = useParams<RouteParams<"mode">>();
  const organization = useOrganization();

  return (availableHours: string | null | undefined) => {
    if (!availableHours) return false;

    const now = dayjs().tz(STORE_TIMEZONE);

    if (mode !== ORDER_MODE.Pickup) return !isOpenAt(availableHours, now);

    if (!organization) return false;

    return isOutsidePickupWindow(
      getPickupWindow(organization, now),
      availableHours,
    );
  };
};
