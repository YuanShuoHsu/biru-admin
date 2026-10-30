import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type {
  AdminOrderBoardColumn,
  AdminOrderListResponse,
  PrepTimeResponse,
} from "@/types/orders";

interface GetAdminOrdersQuery {
  page?: number;
  pageSize?: number;
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export const getAdminOrders = cache(
  async (
    organizationSlug: string,
    {
      page = 1,
      pageSize = 10,
      filterField,
      filterOperator,
      filterValue,
      quickFilterEnums,
      quickFilterValue,
      sortBy,
      sortDirection,
    }: GetAdminOrdersQuery = {},
    init?: RequestInit,
  ) => {
    const offset = (page - 1) * pageSize;
    const isNoValueOperator =
      filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
      ...(sortBy && { sortBy }),
      ...(sortDirection && { sortDirection }),
      ...(filterField &&
        filterOperator &&
        (filterValue || isNoValueOperator) && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });
    for (const entry of quickFilterEnums || [])
      params.append("quickFilterEnums", entry);

    const result = await fetcher<AdminOrderListResponse>(
      `/api/organizations/${organizationSlug}/orders?${params.toString()}`,
      init,
    );

    return {
      orders: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getAdminOrderBoard = cache(
  async (
    organizationSlug: string,
    init?: RequestInit,
  ): Promise<AdminOrderBoardColumn[]> => {
    const columns = await fetcher<AdminOrderBoardColumn[]>(
      `/api/organizations/${organizationSlug}/orders/board/admin`,
      init,
    );

    return Array.isArray(columns) ? columns : [];
  },
);

export const getAdminPrepTimes = cache(
  async (
    organizationSlug: string,
    init?: RequestInit,
  ): Promise<PrepTimeResponse[]> => {
    try {
      const prepTimes = await fetcher<PrepTimeResponse[]>(
        `/api/organizations/${organizationSlug}/orders/prep-times`,
        init,
      );

      return Array.isArray(prepTimes) ? prepTimes : [];
    } catch {
      return [];
    }
  },
);
