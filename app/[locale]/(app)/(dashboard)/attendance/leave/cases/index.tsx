"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import AssignChildDialog from "./AssignChildDialog";
import LeaveCaseDialog from "./LeaveCaseDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, ChildCare } from "@mui/icons-material";
import { Alert, Button, IconButton, Stack, Tooltip } from "@mui/material";
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
  AttendanceEmployee,
  AttendanceLeaveCase,
  AttendanceLeaveCaseFilterField,
  AttendanceLeaveCasePage,
  AttendanceLeaveCaseSortField,
  AttendanceLeaveType,
  AttendanceParentalChild,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface LeaveCasesProps {
  canAssignChild: boolean;
  canSetDailyPay: boolean;
  canViewAll: boolean;
  canWrite: boolean;
  currency: string;
  employeeId?: string;
  employees: AttendanceEmployee[];
  filterField?: AttendanceLeaveCaseFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveTypes: AttendanceLeaveType[];
  organizationSlug: string;
  page: number;
  pageSize: number;
  parentalChildren: AttendanceParentalChild[];
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceLeaveCase[];
  sortBy?: AttendanceLeaveCaseSortField;
  sortDirection?: SortDirection;
}

const LeaveCases = ({
  canAssignChild,
  canSetDailyPay,
  canViewAll,
  canWrite,
  currency,
  employeeId,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes,
  organizationSlug,
  page,
  pageSize,
  parentalChildren,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: LeaveCasesProps) => {
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
    "leave-cases",
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
      fetcher<AttendanceLeaveCasePage>(
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

  const handleCreateLeaveCase = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <LeaveCaseDialog
            canSetDailyPay={canSetDailyPay}
            currency={currency}
            employeeId={employeeId}
            employees={employees}
            leaveTypes={leaveTypes}
            mutate={mutate}
            organizationSlug={organizationSlug}
            parentalChildren={parentalChildren}
          />
        ),
        formId: "attendance-leave-case-form",
        open: true,
        title: tAttendance("leaveCases.actions.create"),
      }),
    [
      canSetDailyPay,
      currency,
      employeeId,
      employees,
      leaveTypes,
      mutate,
      organizationSlug,
      parentalChildren,
      setDialog,
      tAttendance,
    ],
  );

  const handleAssignChild = useCallback(
    (leaveCase: AttendanceLeaveCase) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <AssignChildDialog
            leaveCase={leaveCase}
            mutate={mutate}
            organizationSlug={organizationSlug}
            parentalChildren={parentalChildren}
          />
        ),
        formId: "attendance-assign-child-form",
        open: true,
        title: tAttendance("assignParentalChild"),
      }),
    [mutate, organizationSlug, parentalChildren, setDialog, tAttendance],
  );

  const isParentalLeave = useCallback(
    (leaveTypeId: string) =>
      leaveTypes.find(({ id }) => id === leaveTypeId)?.statutoryKind ===
      "parental",
    [leaveTypes],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canAssignChild
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceLeaveCase>) =>
                isParentalLeave(row.leaveTypeId) &&
                row.employeeId !== employeeId &&
                !row.childId ? (
                  <Stack alignItems="center" direction="row" height="100%">
                    <Tooltip title={tAttendance("assignParentalChild")}>
                      <IconButton
                        onClick={() => handleAssignChild(row)}
                        size="small"
                      >
                        <ChildCare fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ) : null,
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
      {
        field: "leaveTypeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("leaveType"),
      },
      {
        field: "reference",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("caseReference"),
      },
      {
        field: "startsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("startsAt"),
        valueFormatter: (value: string) => date(value),
      },
      {
        field: "endsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("endsAt"),
        valueFormatter: (value: string) => date(value),
      },
      {
        field: "grantedMinutes",
        filterOperators: numberFilterOperators,
        headerName: tAttendance("grantedMinutes"),
        type: "number",
      },
      {
        field: "usedMinutes",
        filterable: false,
        headerName: tAttendance("usedMinutes"),
        sortable: false,
        type: "number",
      },
      {
        field: "paidPercent",
        filterOperators: numberFilterOperators,
        headerName: tAttendance("paidPercent"),
        type: "number",
      },
      {
        field: "childId",
        filterable: false,
        headerName: tAttendance("parentalChild"),
        renderCell: renderEmptyableCell,
        sortable: false,
        valueGetter: (value: string | null, row: AttendanceLeaveCase) =>
          isParentalLeave(row.leaveTypeId)
            ? (parentalChildren.find((child) => child.id === value)?.label ??
              tAttendance("errors.parentalChildUnassigned"))
            : null,
      },
      {
        field: "reason",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("reason"),
        renderCell: renderEmptyableCell,
      },
    ],
    [
      canAssignChild,
      date,
      dateFilterOperators,
      employeeId,
      handleAssignChild,
      isParentalLeave,
      numberFilterOperators,
      parentalChildren,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      <Alert severity="info">{tAttendance("leaveCaseHint")}</Alert>
      {canWrite && (
        <Button
          onClick={handleCreateLeaveCase}
          size="small"
          startIcon={<Add />}
          sx={{ alignSelf: "flex-start" }}
          variant="contained"
        >
          {tAttendance("leaveCases.actions.create")}
        </Button>
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

export default LeaveCases;
