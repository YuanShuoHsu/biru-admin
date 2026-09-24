"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import BalanceDialog from "./BalanceDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add } from "@mui/icons-material";
import { Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridRenderCellParams,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  AttendanceLeaveBalance,
  AttendanceLeaveBalanceFilterField,
  AttendanceLeaveBalancePage,
  AttendanceLeaveBalanceSortField,
  AttendanceLeaveType,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { attendancePath, getStatutoryLeaveName } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface BalancesProps {
  canViewAll: boolean;
  canWrite: boolean;
  employees: AttendanceEmployee[];
  filterField?: AttendanceLeaveBalanceFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveTypes: AttendanceLeaveType[];
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceLeaveBalance[];
  sortBy?: AttendanceLeaveBalanceSortField;
  sortDirection?: SortDirection;
}

const Balances = ({
  canViewAll,
  canWrite,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: BalancesProps) => {
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

  const { setDialog } = useDialogStore((state) => state);

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "short"),
    [format],
  );

  const base = attendancePath(
    organizationSlug,
    canViewAll ? "org" : "me",
    "leave-balances",
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR(
    [base, paginationModel, filterModel, sortModel],
    () =>
      fetcher<AttendanceLeaveBalancePage>(
        `${base}?${getDataGridSearchParams(paginationModel, filterModel, sortModel)}`,
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

  const handleCreateBalance = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <BalanceDialog
            employees={employees}
            leaveTypes={leaveTypes}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-balance-form",
        open: true,
        title: tAttendance("balances.actions.create"),
      }),
    [employees, leaveTypes, mutate, organizationSlug, setDialog, tAttendance],
  );

  const leaveTypeOptions = useMemo(
    () =>
      leaveTypes.map((leaveType) => ({
        label: getStatutoryLeaveName(tAttendance, leaveType),
        value: leaveType.name,
      })),
    [leaveTypes, tAttendance],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "leaveTypeName",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("leaveType.label"),
        renderCell: ({
          row: { leaveTypeName, leaveTypeStatutoryKind },
        }: GridRenderCellParams<AttendanceLeaveBalance>) =>
          getStatutoryLeaveName(tAttendance, {
            name: leaveTypeName,
            statutoryKind: leaveTypeStatutoryKind,
          }),
        type: "singleSelect",
        valueOptions: leaveTypeOptions,
      },
      {
        field: "year",
        filterOperators: numberFilterOperators,
        headerName: tAttendance("year"),
        type: "number",
      },
      {
        field: "startsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("startsAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) => (value ? date(value) : ""),
      },
      {
        field: "endsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("endsAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) => (value ? date(value) : ""),
      },
      {
        field: "grantedMinutes",
        filterOperators: numberFilterOperators,
        headerName: tAttendance("grantedMinutes"),
        type: "number",
      },
      {
        field: "usedMinutes",
        filterOperators: numberFilterOperators,
        headerName: tAttendance("usedMinutes"),
        type: "number",
      },
    ],
    [
      date,
      dateFilterOperators,
      enumFilterOperators,
      leaveTypeOptions,
      numberFilterOperators,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {canWrite && (
        <StyledButton
          onClick={handleCreateBalance}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tAttendance("balances.actions.create")}
        </StyledButton>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        loading={loading}
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
    </>
  );
};

export default Balances;
