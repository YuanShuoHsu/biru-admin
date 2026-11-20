import { cache } from "react";

import { fetcher } from "./fetcher";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

import type {
  StorePhoto,
  StorePhotoFilterField,
  StorePhotoSortField,
} from "@/types/storePhotos";

type GetStorePhotosQuery = GridQuery<
  StorePhotoFilterField,
  StorePhotoSortField
>;

export const getStorePhotos = cache(
  async (query: GetStorePhotosQuery = {}, init?: RequestInit) => {
    const params = getGridSearchParams(query);

    const result = await fetcher<{ data: StorePhoto[]; total: number }>(
      `/api/store-photos?${params.toString()}`,
      init,
    );

    return {
      storePhotos: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
