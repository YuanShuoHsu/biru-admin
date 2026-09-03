import type { Dayjs } from "dayjs";

import { PICKUP_MINUTES_STEP } from "@/constants/pickup";

import type { OrganizationResponse } from "@/types/organizations";

import { getCloseTimeAt, isOpenOn, isUnrestricted } from "@/utils/openingHours";

export interface PickupWindow {
  cutoffMinutes: number;
  from: Dayjs;
  openingHours: string;
  to: Dayjs;
}

type PickupOrganization = Pick<
  OrganizationResponse,
  | "openingHours"
  | "pickupCutoffMinutes"
  | "pickupLeadMinutes"
  | "pickupMaxAdvanceDays"
>;

export const getPickupWindow = (
  organization: PickupOrganization,
  now: Dayjs,
): PickupWindow => {
  const base = now.startOf("minute");

  return {
    cutoffMinutes: organization.pickupCutoffMinutes,
    from: base.add(organization.pickupLeadMinutes, "minute"),
    openingHours: organization.openingHours || "",
    to: base.add(organization.pickupMaxAdvanceDays, "day").endOf("day"),
  };
};

export const isStorePickupTime = (
  { cutoffMinutes, from, openingHours, to }: PickupWindow,
  value: Dayjs,
): boolean => {
  const at = value.second(0).millisecond(0);

  if (at.isBefore(from) || at.isAfter(to)) return false;
  if (isUnrestricted(openingHours)) return true;

  const closeTime = getCloseTimeAt(openingHours, at);

  return !!closeTime && closeTime.diff(at, "minute") >= cutoffMinutes;
};

export const hasPickupTimeInHour = (
  at: Dayjs,
  isAllowed: (at: Dayjs) => boolean,
): boolean =>
  Array.from({ length: 60 / PICKUP_MINUTES_STEP }, (_, index) =>
    at.minute(index * PICKUP_MINUTES_STEP),
  ).some(isAllowed);

export const hasPickupTimeOnDate = (
  { from, openingHours, to }: PickupWindow,
  date: Dayjs,
  isAllowed: (at: Dayjs) => boolean,
): boolean =>
  !date.isBefore(from, "day") &&
  !date.isAfter(to, "day") &&
  isOpenOn(openingHours, date) &&
  Array.from({ length: 24 }, (_, hour) => date.hour(hour)).some((at) =>
    hasPickupTimeInHour(at, isAllowed),
  );

const MAX_SCAN_DAYS = 8;

export const hasPickupTimeInWindow = (
  pickupWindow: PickupWindow,
  isAllowed: (at: Dayjs) => boolean,
): boolean => {
  const { from, to } = pickupWindow;
  const days = Math.min(Math.max(to.diff(from, "day") + 1, 0), MAX_SCAN_DAYS);

  return Array.from({ length: days }, (_, index) =>
    from.add(index, "day"),
  ).some((date) => hasPickupTimeOnDate(pickupWindow, date, isAllowed));
};
