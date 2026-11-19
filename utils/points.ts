import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  OrganizationPointTransactionListResponse,
  PointReport,
  PointReportDetail,
  PointSetting,
  PointTransactionFilterField,
  PointTransactionSortField,
} from "@/types/points";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

export const getPointSetting = cache((init?: RequestInit) =>
  fetcher<PointSetting>("/api/point-settings", init),
);

export const getPointReport = cache((month: string, init?: RequestInit) =>
  fetcher<PointReport>(`/api/point-reports?month=${month}`, init),
);

export const getPointReportDetail = cache(
  (organizationId: string, month: string, init?: RequestInit) =>
    fetcher<PointReportDetail>(
      `/api/point-reports/${organizationId}?month=${month}`,
      init,
    ),
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
    const result = await fetcher<OrganizationPointTransactionListResponse>(
      `/api/organizations/${organizationSlug}/point-transactions?${getGridSearchParams(query).toString()}`,
      init,
    );

    return {
      transactions: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
