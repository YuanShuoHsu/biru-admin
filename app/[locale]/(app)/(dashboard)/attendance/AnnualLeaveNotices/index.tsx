"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";
import EmptyCell from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useDurationFilterOperators,
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type {
  AttendanceAnnualLeaveNotice,
  AttendanceAnnualLeaveNoticeFilterField,
  AttendanceAnnualLeaveNoticePage,
  AttendanceAnnualLeaveNoticeSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  attendancePath,
  formatLeaveDuration,
  fromCents,
} from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceAnnualLeaveNoticeEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

interface AnnualLeaveNoticesProps {
  canViewAll?: boolean;
  filterField?: AttendanceAnnualLeaveNoticeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: AttendanceAnnualLeaveNotice[];
  sortBy?: AttendanceAnnualLeaveNoticeSortField;
  sortDirection?: SortDirection;
}

const AnnualLeaveNotices = ({
  canViewAll = false,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: AnnualLeaveNoticesProps) => {
  const currency = organization?.currency ?? "";
  const organizationSlug = organization?.slug ?? "";

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );

  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items:
      initialFilterField &&
      initialFilterOperator &&
      (initialFilterValue ||
        NO_VALUE_FILTER_OPERATORS.includes(initialFilterOperator))
        ? [
            {
              field: initialFilterField,
              operator: initialFilterOperator,
              value:
                initialFilterOperator === "isAnyOf"
                  ? initialFilterValue?.split(",")
                  : initialFilterValue,
            },
          ]
        : [],
    quickFilterValues: initialQuickFilterValue ? [initialQuickFilterValue] : [],
  });

  const dateFilterOperators = useDateFilterOperators();
  const durationFilterOperators = useDurationFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getAttendanceAnnualLeaveNoticeEnumOptions(tAttendance),
    [tAttendance],
  );

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "dateTime"),
    [format],
  );

  const base = attendancePath(
    organizationSlug,
    canViewAll ? "org" : "me",
    "annual-leave-notices",
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    !loading && [base, paginationModel, filterModel, sortModel],
    () =>
      fetcher<AttendanceAnnualLeaveNoticePage>(
        `${base}?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
      ),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

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

  const columns = useMemo<GridColDef[]>(() => {
    const duration = (minutes: number) =>
      formatLeaveDuration(tAttendance, minutes, false);

    return [
      ...(canViewAll
        ? [
            {
              field: "employeeName",
              filterOperators: stringFilterOperators,
              headerName: tAttendance("employee"),
            },
            {
              field: "employeeEmail",
              filterOperators: stringFilterOperators,
              headerName: tAttendance("account"),
            },
          ]
        : []),
      {
        field: "periodStart",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("annualLeaveNotices.periodStart"),
        valueFormatter: (value: string) => date(value),
      },
      {
        field: "periodEnd",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("annualLeaveNotices.periodEnd"),
        valueFormatter: (value: string) => date(value),
      },
      {
        field: "notifiedAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("annualLeaveNotices.notifiedAt"),
        renderCell: ({
          value,
        }: GridRenderCellParams<AttendanceAnnualLeaveNotice, string | null>) =>
          value ? date(value) : <EmptyCell />,
      },
      {
        field: "grantedMinutes",
        filterOperators: durationFilterOperators,
        headerName: tAttendance("grantedMinutes"),
        type: "number",
        valueFormatter: duration,
      },
      {
        field: "carriedInMinutes",
        filterOperators: durationFilterOperators,
        headerName: tAttendance("annualLeaveNotices.carriedIn"),
        renderCell: ({
          value,
        }: GridRenderCellParams<AttendanceAnnualLeaveNotice, number>) =>
          value ? duration(value) : <EmptyCell />,
        type: "number",
      },
      {
        field: "usedMinutes",
        filterOperators: durationFilterOperators,
        headerName: tAttendance("usedMinutes"),
        type: "number",
        valueFormatter: duration,
      },
      {
        field: "leaves",
        filterable: false,
        headerName: tAttendance("annualLeaveNotices.dates"),
        renderCell: ({
          row: { leaves },
        }: GridRenderCellParams<AttendanceAnnualLeaveNotice>) =>
          leaves.length ? (
            format.list(
              leaves.map(({ endsAt, startsAt }) =>
                format.dateTimeRange(
                  new Date(startsAt),
                  new Date(endsAt),
                  "dateTime",
                ),
              ),
              "enumeration",
            )
          ) : (
            <EmptyCell />
          ),
        sortable: false,
      },
      {
        field: "unusedMinutes",
        filterOperators: durationFilterOperators,
        headerName: tAttendance("annualLeaveNotices.unused"),
        type: "number",
        valueFormatter: duration,
      },
      {
        field: "settlement",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("annualLeaveNotices.settlement"),
        type: "singleSelect",
        valueFormatter: (value: AttendanceAnnualLeaveNotice["settlement"]) =>
          tAttendance(`annualLeaveNotices.settlements.${value}`),
        valueOptions: enumOptions.settlement,
      },
      {
        field: "payouts",
        filterable: false,
        headerName: tAttendance("annualLeaveNotices.payout"),
        renderCell: ({
          row: { payouts },
        }: GridRenderCellParams<AttendanceAnnualLeaveNotice>) =>
          payouts.length ? (
            format.list(
              payouts.map(({ amountCents, month }) =>
                tAttendance("annualLeaveNotices.payoutMonth", {
                  amount: formatMoney(fromCents(amountCents), currency, {
                    minimumFractionDigits: 2,
                  }),
                  month: dayjs(month).format(monthFormat),
                }),
              ),
              "enumeration",
            )
          ) : (
            <EmptyCell />
          ),
        sortable: false,
      },
    ];
  }, [
    canViewAll,
    currency,
    date,
    dateFilterOperators,
    durationFilterOperators,
    enumFilterOperators,
    enumOptions.settlement,
    format,
    formatMoney,
    monthFormat,
    stringFilterOperators,
    tAttendance,
  ]);

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

export default AnnualLeaveNotices;
