"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";

import type { GridColDef } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type {
  AttendanceParentalChild,
  AttendanceParentalChildFilterField,
  AttendanceParentalChildPage,
  AttendanceParentalChildSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendancePath } from "@/utils/attendance";
import { getDataGridSearchParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";

interface MyChildrenProps {
  filterField?: AttendanceParentalChildFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: AttendanceParentalChild[];
  sortBy?: AttendanceParentalChildSortField;
  sortDirection?: SortDirection;
}

const MyChildren = ({
  filterField,
  filterOperator,
  filterValue,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: MyChildrenProps) => {
  const organizationSlug = organization?.slug ?? "";

  const {
    filterModel,
    handleFilterModelChange,
    handlePaginationModelChange,
    handleSortModelChange,
    paginationModel,
    sortModel,
  } = useDataGridQueryState({
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  });

  const dateFilterOperators = useDateFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const base = attendancePath(organizationSlug, "me", "children");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    !loading && [base, paginationModel, filterModel, sortModel],
    () =>
      fetcher<AttendanceParentalChildPage>(
        `${base}?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
      ),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      keepPreviousData: true,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "label",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("childLabel"),
      },
      {
        field: "reference",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("childReference"),
      },
      {
        field: "birthDate",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("childBirthDate"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "date"),
      },
    ],
    [dateFilterOperators, format, stringFilterOperators, tAttendance],
  );

  return (
    <DataGrid
      {...DATA_GRID_PROPS}
      apiRef={apiRef}
      columns={columns}
      filterMode="server"
      filterModel={filterModel}
      loading={loading || isValidating}
      onFilterModelChange={handleFilterModelChange}
      onPaginationModelChange={handlePaginationModelChange}
      onSortModelChange={handleSortModelChange}
      pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
      paginationMode="server"
      paginationModel={paginationModel}
      rowCount={rowCount}
      rows={rows}
      sortingMode="server"
      sortModel={sortModel}
    />
  );
};

export default MyChildren;
