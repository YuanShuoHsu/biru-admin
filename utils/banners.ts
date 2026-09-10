import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type {
  Banner,
  BannerFilterField,
  BannerSortField,
} from "@/types/banners";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

interface GetBannersQuery {
  page?: number;
  pageSize?: number;
  filterField?: BannerFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: BannerSortField;
  sortDirection?: SortDirection;
}

export const getBanners = cache(
  async (
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
    }: GetBannersQuery = {},
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
      for (const entry of quickFilterEnums || [])
        params.append("quickFilterEnums", entry);

      const result = await fetcher<{ data: Banner[]; total: number }>(
        `/api/banners?${params.toString()}`,
        init,
      );

      return {
        banners: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { banners: [], total: 0 };
    }
  },
);
