"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import EmployeeDialog from "./EmployeeDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useBooleanFilterOperators,
  useDateFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Edit } from "@mui/icons-material";
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployeeFilterField,
  AttendanceEmployeeSortField,
  AttendanceMember,
  AttendanceMemberPage,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface EmployeesProps {
  canWrite: boolean;
  filterField?: AttendanceEmployeeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceMember[];
  sortBy?: AttendanceEmployeeSortField;
  sortDirection?: SortDirection;
}

const Employees = ({
  canWrite,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: EmployeesProps) => {
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

  const booleanFilterOperators = useBooleanFilterOperators();
  const dateFilterOperators = useDateFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "date"),
    [format],
  );

  const base = attendancePath(organizationSlug, "org", "members");

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
      fetcher<AttendanceMemberPage>(
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

  const handleEmployeeDialog = useCallback(
    (member: AttendanceMember) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <EmployeeDialog
            member={member}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-employee-form",
        open: true,
        title: tAttendance(
          member.employee
            ? "employees.actions.update"
            : "employees.actions.create",
        ),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canWrite
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({ row }: GridRenderCellParams<AttendanceMember>) => (
                <Stack height="100%" direction="row" alignItems="center">
                  <Tooltip
                    title={tAttendance(
                      row.employee
                        ? "employees.actions.update"
                        : "employees.actions.create",
                    )}
                  >
                    <IconButton
                      onClick={() => handleEmployeeDialog(row)}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "hiredAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("hiredAt"),
        renderCell: renderEmptyableCell,
        valueGetter: (_, row: AttendanceMember) => row.employee?.hiredAt,
        valueFormatter: (value: string | undefined) =>
          value ? date(value) : "",
      },
      {
        field: "terminatedAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("terminatedAt"),
        renderCell: renderEmptyableCell,
        valueGetter: (_, row: AttendanceMember) => row.employee?.terminatedAt,
        valueFormatter: (value: string | null | undefined) =>
          value ? date(value) : "",
      },
      {
        // 欄位顯示小時但後端以分鐘比對，開放篩選會讓輸入的數字對不上
        field: "weeklyMinutes",
        filterable: false,
        headerName: tAttendance("weeklyMinutes"),
        renderCell: renderEmptyableCell,
        type: "number",
        valueFormatter: (value: number | undefined) =>
          value == null
            ? ""
            : format.number(value / 60, {
                maximumFractionDigits: 1,
              }),
        valueGetter: (_, row: AttendanceMember) => row.employee?.weeklyMinutes,
      },
      {
        field: "enabled",
        filterOperators: booleanFilterOperators,
        headerName: tAttendance("enabled"),
        renderCell: ({
          row: { employee },
        }: GridRenderCellParams<AttendanceMember>) => (
          <Chip
            color={
              !employee ? "warning" : employee.enabled ? "success" : "default"
            }
            label={tAttendance(
              !employee
                ? "employees.unconfigured"
                : employee.enabled
                  ? "enabled"
                  : "disabled",
            )}
            size="small"
            variant="outlined"
          />
        ),
        type: "boolean",
        valueGetter: (_, row: AttendanceMember) => row.employee?.enabled,
      },
    ],
    [
      booleanFilterOperators,
      canWrite,
      date,
      dateFilterOperators,
      format,
      handleEmployeeDialog,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        getRowId={({ userId }) => userId}
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

export default Employees;
