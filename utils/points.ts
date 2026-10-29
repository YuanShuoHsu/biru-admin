import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  OrganizationPointTransactionListResponse,
  PointSetting,
  PointTransactionFilterField,
  PointTransactionSortField,
} from "@/types/points";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

export const getPointSetting = cache((init?: RequestInit) =>
  fetcher<PointSetting>("/api/point-settings", init),
);

export const getOrganizationPointTransactions = cache(
  async (
    organizationSlug: string,
    query: GridQuery<
      PointTransactionFilterField,
      PointTransactionSortField
    > = {},
    init?: RequestInit,
  ) => {
    try {
      const result = await fetcher<OrganizationPointTransactionListResponse>(
        `/api/organizations/${organizationSlug}/point-transactions?${getGridSearchParams(query).toString()}`,
        init,
      );

      return {
        transactions: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { transactions: [], total: 0 };
    }
  },
);
