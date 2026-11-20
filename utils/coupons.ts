import { cache } from "react";

import { fetcher } from "./fetcher";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

import type {
  Coupon,
  CouponFilterField,
  CouponListResponse,
  CouponRecipientFilterField,
  CouponRecipientListResponse,
  CouponRecipientSortField,
  CouponSortField,
} from "@/types/coupons";

interface GetCouponsQuery
  extends GridQuery<CouponFilterField, CouponSortField> {
  organizationSlug?: string;
}

type GetCouponRecipientsQuery = GridQuery<
  CouponRecipientFilterField,
  CouponRecipientSortField
>;

export const getCouponsPath = (organizationSlug?: string) =>
  organizationSlug
    ? `/api/organizations/${organizationSlug}/coupons`
    : "/api/coupons";

export const getCoupons = cache(
  async (
    locale: string,
    { organizationSlug, ...query }: GetCouponsQuery = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
    params.set("lang", locale);

    const result = await fetcher<CouponListResponse>(
      `${getCouponsPath(organizationSlug)}?${params.toString()}`,
      init,
    );

    return {
      coupons: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);

export const getCoupon = cache((couponId: string, init?: RequestInit) =>
  fetcher<Coupon>(`/api/coupons/${couponId}`, init),
);

export const getCouponRecipients = cache(
  async (
    couponId: string,
    query: GetCouponRecipientsQuery = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);

    const result = await fetcher<CouponRecipientListResponse>(
      `/api/coupons/${couponId}/recipients?${params.toString()}`,
      init,
    );

    return {
      recipients: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
