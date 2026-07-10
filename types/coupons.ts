import type { components } from "@/types/api";

export type AvailableCoupon = components["schemas"]["AvailableCouponDto"];
export type ClaimableCoupon = components["schemas"]["ClaimableCouponDto"];
export type Coupon = components["schemas"]["CouponResponseDto"];
export type CouponDiscountType = Coupon["discountType"];
export type CouponIssueTrigger = NonNullable<Coupon["issueTrigger"]>;
export type CouponScope = Coupon["scope"];
export type CreateCouponDto = components["schemas"]["CreateCouponDto"];
export type GrantCouponDto = components["schemas"]["GrantCouponDto"];
export type MyCoupon = components["schemas"]["MyCouponResponseDto"];
export type UpdateCouponDto = components["schemas"]["UpdateCouponDto"];
export type UserCoupon = components["schemas"]["UserCouponResponseDto"];
export type ValidateCouponDto = components["schemas"]["ValidateCouponDto"];
export type ValidateCouponResponse =
  components["schemas"]["ValidateCouponResponseDto"];
