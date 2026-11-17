"use client";

import { useCallback, useState } from "react";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import type {
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getFilterItemParams } from "@/utils/dataGrid";

interface UseDataGridQueryStateOptions {
  filterField?: string;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: string;
  sortDirection?: SortDirection;
}

export const useDataGridQueryState = ({
  filterField,
  filterOperator,
  filterValue,
  page,
  pageSize,
  quickFilterValue,
  sortBy,
  sortDirection,
}: UseDataGridQueryStateOptions) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items:
      filterField &&
      filterOperator &&
      (filterValue || NO_VALUE_FILTER_OPERATORS.includes(filterOperator))
        ? [
            {
              field: filterField,
              operator: filterOperator,
              value:
                filterOperator === "isAnyOf"
                  ? filterValue?.split(",")
                  : filterValue,
            },
          ]
        : [],
    quickFilterValues: quickFilterValue ? [quickFilterValue] : [],
  });

  const updateQuery = useUpdateQuery();

  const handlePaginationModelChange = useCallback(
    (newModel: GridPaginationModel) => {
      setPaginationModel(newModel);

      updateQuery({
        page: String(newModel.page + 1),
        pageSize: String(newModel.pageSize),
      });
    },
    [updateQuery],
  );

  const handleSortModelChange = useCallback(
    (newModel: GridSortModel) => {
      setSortModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      updateQuery({
        page: "1",
        sortBy: newModel[0]?.field ?? "",
        sortDirection: newModel[0]?.sort ?? "",
      });
    },
    [updateQuery],
  );

  const handleFilterModelChange = useCallback(
    (newModel: GridFilterModel) => {
      setFilterModel(newModel);
      setPaginationModel((previous) => ({ ...previous, page: 0 }));

      const {
        filterField = "",
        filterOperator = "",
        filterValue = "",
      } = getFilterItemParams(newModel.items[0]);

      updateQuery({
        filterField,
        filterOperator,
        filterValue,
        page: "1",
        quickFilterValue: (newModel.quickFilterValues ?? []).join(" ").trim(),
      });
    },
    [updateQuery],
  );

  return {
    filterModel,
    handleFilterModelChange,
    handlePaginationModelChange,
    handleSortModelChange,
    paginationModel,
    setPaginationModel,
    sortModel,
  };
};
