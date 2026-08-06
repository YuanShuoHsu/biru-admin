import {
  type components,
  couponFilterFieldValues,
  couponRecipientFilterFieldValues,
  couponRecipientSortFieldValues,
  couponSortFieldValues,
} from "@/types/api";

export type AvailableCoupon = components["schemas"]["AvailableCouponDto"];
export type Coupon = components["schemas"]["CouponResponseDto"];
export type CouponDiscountType = Coupon["discountType"];
export type CouponIssueTrigger = NonNullable<Coupon["issueTrigger"]>;
export type CouponRecipient =
  components["schemas"]["CouponRecipientResponseDto"];
export type CouponScope = Coupon["scope"];
export type CreateCouponDto = components["schemas"]["CreateCouponDto"];
export type GrantCouponDto = components["schemas"]["GrantCouponDto"];
export type MyClaimableCoupon = components["schemas"]["MyClaimableCouponDto"];
export type MyCoupon = components["schemas"]["MyCouponResponseDto"];
export type UpdateCouponDto = components["schemas"]["UpdateCouponDto"];
export type UserCoupon = components["schemas"]["UserCouponResponseDto"];
export type ValidateCouponDto = components["schemas"]["ValidateCouponDto"];
export type ValidateCouponResponse =
  components["schemas"]["ValidateCouponResponseDto"];

export type CouponFilterField = (typeof couponFilterFieldValues)[number];
export type CouponSortField = (typeof couponSortFieldValues)[number];
export type CouponRecipientFilterField =
  (typeof couponRecipientFilterFieldValues)[number];
export type CouponRecipientSortField =
  (typeof couponRecipientSortFieldValues)[number];
