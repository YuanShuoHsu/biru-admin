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

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

export const useOutsideAvailableHours = () => {
  const { mode } = useParams<RouteParams<"mode">>();
  const organization = useOrganization();

  const checksNow =
    mode !== ORDER_MODE.Pickup ||
    (!!organization && !organization.pickupSchedulingEnabled);

  return (availableHours: string | null | undefined) =>
    checksNow &&
    !!availableHours &&
    !isOpenAt(availableHours, dayjs().tz(STORE_TIMEZONE));
};
