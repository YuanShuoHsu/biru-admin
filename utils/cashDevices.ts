import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  CashDeviceFilterField,
  CashDeviceListResponse,
  CashDeviceSortField,
} from "@/types/cashDevices";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

export const getCashDevices = cache(
  async (
    organizationSlug: string,
    query: GridQuery<CashDeviceFilterField, CashDeviceSortField> = {},
    init?: RequestInit,
  ) => {
    const result = await fetcher<CashDeviceListResponse>(
      `/api/organizations/${organizationSlug}/cash-devices?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      cashDevices: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
