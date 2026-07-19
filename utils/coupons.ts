import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type {
  Coupon,
  CouponFilterField,
  CouponSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

interface GetCouponsQuery {
  page?: number;
  pageSize?: number;
  filterField?: CouponFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  quickFilterValue?: string;
  sortBy?: CouponSortField;
  sortDirection?: SortDirection;
}

export const getCoupons = cache(
  async (
    locale: string,
    {
      page = 1,
      pageSize = 10,
      filterField,
      filterOperator,
      filterValue,
      quickFilterValue,
      sortBy,
      sortDirection,
    }: GetCouponsQuery = {},
    init?: RequestInit,
  ) => {
    try {
      const offset = (page - 1) * pageSize;
      const isNoValueOperator =
        filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
      const params = new URLSearchParams({
        lang: locale,
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
      const result = await fetcher<{ data: Coupon[]; total: number }>(
        `/api/coupons?${params.toString()}`,
        init,
      );

      return {
        coupons: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { coupons: [], total: 0 };
    }
  },
);
