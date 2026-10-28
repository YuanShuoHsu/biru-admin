import {
  type components,
  storePhotoFilterFieldValues,
  storePhotoSortFieldValues,
} from "@/types/api";
import type { LocalizedText } from "@/types/locale";

export type StorePhoto = Omit<
  components["schemas"]["StorePhotoResponseDto"],
  "alt"
> & { alt: LocalizedText };
export type CreateStorePhotoDto = Omit<
  components["schemas"]["CreateStorePhotoDto"],
  "alt"
> & { alt: LocalizedText };

export type StorePhotoFilterField =
  (typeof storePhotoFilterFieldValues)[number];
export type StorePhotoSortField = (typeof storePhotoSortFieldValues)[number];
