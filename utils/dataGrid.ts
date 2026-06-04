import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";

import type { GridFilterModel, GridSortModel } from "@mui/x-data-grid";

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
