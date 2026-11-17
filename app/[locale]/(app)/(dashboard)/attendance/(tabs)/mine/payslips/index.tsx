"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import { useMonthFilterOperators } from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";

import type { GridColDef } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type {
  PayrollStatementListItem,
  PayrollStatementFilterField,
  PayrollStatementPage,
  PayrollStatementSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  fromCents,
  getPayrollAmountColumns,
  payrollPath,
} from "@/utils/attendance";
import { getDataGridSearchParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface PayslipsProps {
  filterField?: PayrollStatementFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: PayrollStatementListItem[];
  sortBy?: PayrollStatementSortField;
  sortDirection?: SortDirection;
}

const Payslips = ({
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
}: PayslipsProps) => {
  const currency = organization?.currency ?? "";
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

  const monthFilterOperators = useMonthFilterOperators();

  const monthFormat = useMonthFormat();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const tAttendance = useTranslations("attendance");

  const money = useCallback(
    (value: string) =>
      formatMoney(fromCents(value), currency, {
        minimumFractionDigits: 2,
      }),
    [currency, formatMoney],
  );

  const base = payrollPath(organizationSlug, "me", "statements");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    !loading && [base, paginationModel, filterModel, sortModel],
    () =>
      fetcher<PayrollStatementPage>(
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
        field: "month",
        filterOperators: monthFilterOperators,
        headerName: tAttendance("month"),
        valueFormatter: (value: string) => dayjs(value).format(monthFormat),
      },
      {
        field: "paidOn",
        filterable: false,
        headerName: tAttendance("paidOn"),
        renderCell: renderEmptyableCell,
        sortable: false,
        valueFormatter: (value: string | null) =>
          value
            ? format.dateTime(dayjs.tz(value, STORE_TIMEZONE).toDate(), "date")
            : "",
      },
      ...getPayrollAmountColumns(
        tAttendance,
        format,
        money,
        renderEmptyableCell,
      ),
    ],
    [format, money, monthFilterOperators, monthFormat, tAttendance],
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
      slotProps={{
        ...DATA_GRID_PROPS.slotProps,
        toolbar: {
          exportDateField: "month",
        },
      }}
    />
  );
};

export default Payslips;
