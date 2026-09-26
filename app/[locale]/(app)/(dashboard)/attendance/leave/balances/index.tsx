"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import BalanceDialog from "./BalanceDialog";
import DeferralDialog from "./DeferralDialog";

import { renderEmptyableCell } from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useDateFilterOperators,
  useDurationFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, EventRepeat, EventBusy } from "@mui/icons-material";
import { Button, IconButton, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridRenderCellParams,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { enqueueSnackbar } from "notistack";

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
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import {
  attendanceErrorKey,
  attendancePath,
  formatLeaveDuration,
  getStatutoryLeaveName,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface BalancesProps {
  canDefer: boolean;
  canRevokeDeferral: boolean;
  canViewAll: boolean;
  canWrite: boolean;
  employees: AttendanceEmployee[];
  filterField?: AttendanceLeaveBalanceFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveTypes: AttendanceLeaveType[];
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceLeaveBalance[];
  sortBy?: AttendanceLeaveBalanceSortField;
  sortDirection?: SortDirection;
}

const Balances = ({
  canDefer,
  canRevokeDeferral,
  canViewAll,
  canWrite,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes,
  organization: { slug: organizationSlug },
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
  const durationFilterOperators = useDurationFilterOperators();
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

  const handleDefer = useCallback(
    (balance: AttendanceLeaveBalance) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <DeferralDialog
            balance={balance}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-deferral-form",
        open: true,
        title: tAttendance("balances.actions.defer"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleRevokeDeferral = useCallback(
    ({ annualLeaveDeferralId, employeeName }: AttendanceLeaveBalance) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(
                organizationSlug,
                "org",
                `annual-leave-deferrals/${annualLeaveDeferralId}`,
              ),
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tAttendance("balances.deferralRevoked", { name: employeeName }),
              { variant: "success" },
            );
            mutate();
          } catch (error) {
            enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("balances.actions.revokeDeferral"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
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
        filterOperators: durationFilterOperators,
        headerName: tAttendance("grantedMinutes"),
        type: "number",
        valueFormatter: (value: number) =>
          formatLeaveDuration(tAttendance, value, false),
      },
      {
        field: "usedMinutes",
        filterOperators: durationFilterOperators,
        headerName: tAttendance("usedMinutes"),
        type: "number",
        valueFormatter: (value: number) =>
          formatLeaveDuration(tAttendance, value, false),
      },
      ...(canViewAll && (canDefer || canRevokeDeferral)
        ? [
            {
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceLeaveBalance>) => {
                if (row.leaveTypeStatutoryKind !== "annual") return null;

                return row.annualLeaveDeferralId
                  ? canRevokeDeferral && (
                      <Tooltip
                        title={tAttendance("balances.actions.revokeDeferral")}
                      >
                        <IconButton
                          onClick={() => handleRevokeDeferral(row)}
                          size="small"
                        >
                          <EventBusy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )
                  : canDefer && (
                      <Tooltip title={tAttendance("balances.actions.defer")}>
                        <IconButton
                          onClick={() => handleDefer(row)}
                          size="small"
                        >
                          <EventRepeat fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    );
              },
              sortable: false,
            } satisfies GridColDef,
          ]
        : []),
    ],
    [
      canDefer,
      canRevokeDeferral,
      canViewAll,
      handleDefer,
      handleRevokeDeferral,
      date,
      dateFilterOperators,
      durationFilterOperators,
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
