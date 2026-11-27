import {
  type components,
  storePhotoFilterFieldValues,
  storePhotoSortFieldValues,
} from "@/types/api";

export type StorePhoto = components["schemas"]["StorePhotoResponseDto"];
export type StorePhotoListResponse =
  components["schemas"]["StorePhotoListResponseDto"];
export type UpdateStorePhotoDto = components["schemas"]["UpdateStorePhotoDto"];

export type StorePhotoFilterField =
  (typeof storePhotoFilterFieldValues)[number];
export type StorePhotoSortField = (typeof storePhotoSortFieldValues)[number];
