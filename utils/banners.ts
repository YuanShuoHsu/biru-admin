import { cache } from "react";

import { fetcher } from "./fetcher";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

import type {
  BannerFilterField,
  BannerListResponse,
  BannerSortField,
} from "@/types/banners";

type GetBannersQuery = GridQuery<BannerFilterField, BannerSortField>;

export const getBanners = cache(
  async (query: GetBannersQuery = {}, init?: RequestInit) => {
    const params = getGridSearchParams(query);

    const result = await fetcher<BannerListResponse>(
      `/api/banners?${params.toString()}`,
      init,
    );

    return {
      banners: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
