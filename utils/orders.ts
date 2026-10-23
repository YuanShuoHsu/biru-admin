import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type {
  AdminOrderBoardColumn,
  AdminOrderResponse,
  CurrentCashDrawer,
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
    try {
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

      const result = await fetcher<{
        data: AdminOrderResponse[];
        total: number;
      }>(
        `/api/organizations/${organizationSlug}/orders?${params.toString()}`,
        init,
      );

      return {
        orders: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { orders: [], total: 0 };
    }
  },
);

export const cashDrawerPath = (organizationSlug: string) =>
  `/api/organizations/${organizationSlug}/cash-drawer`;

export const getCurrentCashDrawer = cache(
  async (
    organizationSlug: string,
    init?: RequestInit,
  ): Promise<CurrentCashDrawer | null> => {
    try {
      return await fetcher<CurrentCashDrawer>(
        `${cashDrawerPath(organizationSlug)}/current`,
        init,
      );
    } catch {
      return null;
    }
  },
);

export const getAdminOrderBoard = cache(
  async (
    organizationSlug: string,
    init?: RequestInit,
  ): Promise<AdminOrderBoardColumn[]> => {
    try {
      const columns = await fetcher<AdminOrderBoardColumn[]>(
        `/api/organizations/${organizationSlug}/orders/board/admin`,
        init,
      );

      return Array.isArray(columns) ? columns : [];
    } catch {
      return [];
    }
  },
);
