import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type {
  GridFilterItem,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";

export const isFilteredOrSorted = (
  filterModel: GridFilterModel,
  sortModel: GridSortModel,
) =>
  sortModel.length > 0 ||
  (filterModel.quickFilterValues ?? []).some((value) => value.trim() !== "") ||
  filterModel.items.some(
    ({ operator, value }) =>
      NO_VALUE_FILTER_OPERATORS.includes(operator) ||
      (Array.isArray(value) ? value.length > 0 : value != null && value !== ""),
  );

export const getFilterItemParams = (filterItem?: GridFilterItem) => {
  const isNoValueOperator =
    !!filterItem?.operator &&
    NO_VALUE_FILTER_OPERATORS.includes(filterItem.operator);
  const filterValueString = Array.isArray(filterItem?.value)
    ? filterItem.value.join(",")
    : filterItem?.value != null
      ? String(filterItem.value)
      : "";
  const hasFilterValue = Array.isArray(filterItem?.value)
    ? filterItem.value.length > 0
    : !!filterValueString;

  return {
    ...(filterItem?.field &&
      filterItem?.operator &&
      (hasFilterValue || isNoValueOperator) && {
        filterField: filterItem.field,
        filterOperator: filterItem.operator,
        ...(filterValueString && { filterValue: filterValueString }),
      }),
  };
};

export const getDataGridSearchParams = (
  paginationModel: GridPaginationModel,
  filterModel: GridFilterModel,
  sortModel: GridSortModel,
) => {
  const quickFilterValue = (filterModel.quickFilterValues || [])
    .join(" ")
    .trim();

  return new URLSearchParams({
    limit: String(paginationModel.pageSize),
    offset: String(paginationModel.page * paginationModel.pageSize),
    ...getFilterItemParams(filterModel.items[0]),
    ...(quickFilterValue && { quickFilterValue }),
    ...(sortModel[0]?.field && { sortBy: sortModel[0].field }),
    ...(sortModel[0]?.sort && { sortDirection: sortModel[0].sort }),
  });
};
