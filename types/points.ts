import {
  pointTransactionFilterFieldValues,
  pointTransactionSortFieldValues,
  type components,
} from "@/types/api";

export type MyPoints = components["schemas"]["MyPointsDto"];
export type OrganizationPointTransaction =
  components["schemas"]["OrganizationPointTransactionDto"];
export type OrganizationPointTransactionListResponse =
  components["schemas"]["OrganizationPointTransactionListResponseDto"];
export type PointAdjustmentLimit =
  components["schemas"]["PointAdjustmentLimitDto"];
export type PointSetting = components["schemas"]["PointSettingResponseDto"];
export type PointTransaction = components["schemas"]["PointTransactionDto"];
export type PointTransactionFilterField =
  (typeof pointTransactionFilterFieldValues)[number];
export type PointTransactionSortField =
  (typeof pointTransactionSortFieldValues)[number];
export type PointsCoupon = components["schemas"]["PointsCouponDto"];
