import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type {
  Coupon,
  CouponFilterField,
  CouponRecipient,
  CouponRecipientFilterField,
  CouponRecipientSortField,
  CouponSortField,
} from "@/types/coupons";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

interface GetCouponsQuery {
  page?: number;
  pageSize?: number;
  filterField?: CouponFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug?: string;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: CouponSortField;
  sortDirection?: SortDirection;
}

interface GetCouponRecipientsQuery {
  page?: number;
  pageSize?: number;
  filterField?: CouponRecipientFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: CouponRecipientSortField;
  sortDirection?: SortDirection;
}

export const getCouponsPath = (organizationSlug?: string) =>
  organizationSlug
    ? `/api/organizations/${organizationSlug}/coupons`
    : "/api/coupons";

export const getCoupons = cache(
  async (
    locale: string,
    {
      page = 1,
      pageSize = 10,
      filterField,
      filterOperator,
      filterValue,
      organizationSlug,
      quickFilterEnums,
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
      for (const entry of quickFilterEnums ?? [])
        params.append("quickFilterEnums", entry);

      const result = await fetcher<{ data: Coupon[]; total: number }>(
        `${getCouponsPath(organizationSlug)}?${params.toString()}`,
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

export const getCoupon = cache(async (couponId: string, init?: RequestInit) => {
  try {
    return await fetcher<Coupon>(`/api/coupons/${couponId}`, init);
  } catch {
    return null;
  }
});

export const getCouponRecipients = cache(
  async (
    couponId: string,
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
    }: GetCouponRecipientsQuery = {},
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
      for (const entry of quickFilterEnums ?? [])
        params.append("quickFilterEnums", entry);

      const result = await fetcher<{ data: CouponRecipient[]; total: number }>(
        `/api/coupons/${couponId}/recipients?${params.toString()}`,
        init,
      );

      return {
        recipients: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { recipients: [], total: 0 };
    }
  },
);
