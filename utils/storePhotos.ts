import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type {
  StorePhoto,
  StorePhotoFilterField,
  StorePhotoSortField,
} from "@/types/storePhotos";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

interface GetStorePhotosQuery {
  page?: number;
  pageSize?: number;
  filterField?: StorePhotoFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: StorePhotoSortField;
  sortDirection?: SortDirection;
}

export const getStorePhotos = cache(
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
    }: GetStorePhotosQuery = {},
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

      const result = await fetcher<{ data: StorePhoto[]; total: number }>(
        `/api/store-photos?${params.toString()}`,
        init,
      );

      return {
        storePhotos: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { storePhotos: [], total: 0 };
    }
  },
);
