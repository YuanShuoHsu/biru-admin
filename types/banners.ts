import {
  type components,
  bannerFilterFieldValues,
  bannerSortFieldValues,
} from "@/types/api";

export type Banner = components["schemas"]["BannerResponseDto"];
export type CreateBannerDto = components["schemas"]["CreateBannerDto"];
export type UpdateBannerDto = components["schemas"]["UpdateBannerDto"];

export type BannerFilterField = (typeof bannerFilterFieldValues)[number];
export type BannerSortField = (typeof bannerSortFieldValues)[number];
