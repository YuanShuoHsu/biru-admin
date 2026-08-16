import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { sortDirectionValues } from "@/types/api";

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
  (filterModel.quickFilterValues || []).some((value) => value.trim() !== "") ||
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

export type QuickFilterEnumOptions = Record<
  string,
  { label: string; value: string }[]
>;

export const getQuickFilterEnums = (
  quickFilterValue: string,
  enumOptions: QuickFilterEnumOptions,
) => {
  const keyword = quickFilterValue.trim().toLocaleLowerCase();
  if (!keyword) return [];

  return Object.entries(enumOptions).flatMap(([field, options]) => {
    const values = options
      .filter(({ label }) => label.toLocaleLowerCase().includes(keyword))
      .map(({ value }) => value);

    return values.length ? [`${field}:${values.join(",")}`] : [];
  });
};

interface GridSearchParams {
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  organization?: string;
  page?: string;
  pageSize?: string;
  quickFilterEnums?: string | string[];
  quickFilterValue?: string;
  sortBy?: string;
  sortDirection?: string;
}

interface ResolveGridSearchParamsOptions<
  SortField extends string,
  FilterField extends string,
  FilterOperator extends string,
> {
  searchParams: GridSearchParams;
  sortFields: readonly SortField[];
  filterFields: readonly FilterField[];
  filterOperators: readonly FilterOperator[];
  organizationSlug?: string;
}

export const resolveGridSearchParams = <
  SortField extends string,
  FilterField extends string,
  FilterOperator extends string,
>({
  searchParams,
  sortFields,
  filterFields,
  filterOperators,
  organizationSlug,
}: ResolveGridSearchParamsOptions<SortField, FilterField, FilterOperator>) => {
  const {
    filterField: rawFilterField,
    filterOperator: rawFilterOperator,
    filterValue,
    organization,
    page: rawPage,
    pageSize: rawPageSize,
    quickFilterEnums: rawQuickFilterEnums,
    quickFilterValue,
    sortBy: rawSortBy,
    sortDirection: rawSortDirection,
    ...restSearchParams
  } = searchParams;

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE);

  const sortBy = sortFields.find((field) => field === rawSortBy);
  const sortDirection = sortDirectionValues.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = filterFields.find((field) => field === rawFilterField);
  const filterOperator = filterOperators.find(
    (operator) => operator === rawFilterOperator,
  );
  const isNoValueOperator =
    !!filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
  const hasFilter =
    !!filterField && !!filterOperator && (!!filterValue || isNoValueOperator);

  const isNormalized =
    (!organizationSlug || organization === organizationSlug) &&
    rawQuickFilterEnums === undefined &&
    rawPage === String(page) &&
    rawPageSize === String(pageSize) &&
    rawSortBy === sortBy &&
    rawSortDirection === sortDirection &&
    !!sortBy === !!sortDirection &&
    rawFilterField === filterField &&
    rawFilterOperator === filterOperator &&
    !!(filterField || filterOperator || filterValue) === hasFilter;

  return {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    redirectParams: isNormalized
      ? null
      : new URLSearchParams({
          ...restSearchParams,
          ...(organizationSlug && { organization: organizationSlug }),
          page: String(page),
          pageSize: String(pageSize),
          ...(sortBy && sortDirection && { sortBy, sortDirection }),
          ...(hasFilter &&
            filterField &&
            filterOperator && {
              filterField,
              filterOperator,
              ...(filterValue && { filterValue }),
            }),
          ...(quickFilterValue && { quickFilterValue }),
        }),
    sortBy,
    sortDirection,
  };
};

export const getDataGridSearchParams = (
  paginationModel: GridPaginationModel,
  filterModel: GridFilterModel,
  sortModel: GridSortModel,
  enumOptions?: QuickFilterEnumOptions,
) => {
  const quickFilterValue = (filterModel.quickFilterValues || [])
    .join(" ")
    .trim();

  const params = new URLSearchParams({
    limit: String(paginationModel.pageSize),
    offset: String(paginationModel.page * paginationModel.pageSize),
    ...getFilterItemParams(filterModel.items[0]),
    ...(quickFilterValue && { quickFilterValue }),
    ...(sortModel[0]?.field && { sortBy: sortModel[0].field }),
    ...(sortModel[0]?.sort && { sortDirection: sortModel[0].sort }),
  });

  if (quickFilterValue && enumOptions)
    for (const entry of getQuickFilterEnums(quickFilterValue, enumOptions))
      params.append("quickFilterEnums", entry);

  return params;
};
