"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import BalanceDialog from "./BalanceDialog";
import DeferralDialog from "./DeferralDialog";

import AuditLogButton from "@/components/AuditLogButton";
import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

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
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Cancel, EventBusy, EventRepeat } from "@mui/icons-material";
import {
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
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
  AttendanceEmployeeSummary,
  AttendanceLeaveBalance,
  AttendanceLeaveBalanceFilterField,
  AttendanceLeaveBalancePage,
  AttendanceLeaveBalanceSortField,
  AttendanceLeaveType,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  attendancePath,
  formatLeaveDuration,
  getStatutoryLeaveName,
} from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface BalancesProps {
  canDefer?: boolean;
  canRevokeDeferral?: boolean;
  canViewAll?: boolean;
  canViewAuditLog?: boolean;
  canWrite?: boolean;
  employees?: AttendanceEmployeeSummary[];
  filterField?: AttendanceLeaveBalanceFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveTypes?: AttendanceLeaveType[];
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: AttendanceLeaveBalance[];
  sortBy?: AttendanceLeaveBalanceSortField;
  sortDirection?: SortDirection;
}

const Balances = ({
  canDefer = false,
  canRevokeDeferral = false,
  canViewAll = false,
  canViewAuditLog = false,
  canWrite = false,
  employees = [],
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes = [],
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: BalancesProps) => {
  const organizationSlug = organization?.slug ?? "";

  const [isSelectMode, setIsSelectMode] = useState(false);
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
    (value: string) => format.dateTime(new Date(value), "dateTime"),
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
    isValidating,
    mutate,
  } = useSWR(
    !loading && [base, paginationModel, filterModel, sortModel],
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

  const isDeferralSelectable = useCallback(
    ({
      annualLeaveDeferralId,
      leaveTypeStatutoryKind,
    }: AttendanceLeaveBalance) =>
      leaveTypeStatutoryKind === "annual" && !!annualLeaveDeferralId,
    [],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isDeferralSelectable,
    rows,
  });

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
        content: (
          <DialogContentText>
            {tAttendance.rich("balances.revokeDeferralConfirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: employeeName,
            })}
          </DialogContentText>
        ),
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
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("balances.actions.revokeDeferral"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleEnterDeferralBatchRevokeMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("balances.actions.batchRevokeDeferral.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("balances.actions.batchRevokeDeferral.title"),
    });
  }, [apiRef, setDialog, tAttendance]);

  const handleSubmitDeferralBatchRevoke = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich(
            "balances.actions.batchRevokeDeferral.submit.confirm",
            {
              bold: (chunks) => <strong>{chunks}</strong>,
              count,
            },
          )}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            attendancePath(organizationSlug, "org", "annual-leave-deferrals"),
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: selectedRows.flatMap(
                  ({ annualLeaveDeferralId }) => annualLeaveDeferralId ?? [],
                ),
              }),
            },
          );

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tAttendance("balances.actions.batchRevokeDeferral.submit.success", {
              count,
            }),
            {
              variant: "success",
            },
          );
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), {
            variant: "error",
          });
        }

        mutate();
      },
      open: true,
      title: tAttendance("balances.actions.batchRevokeDeferral.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    clearRowSelection,
    mutate,
    organizationSlug,
    selectedRows,
    setDialog,
    tAttendance,
  ]);

  const handleCancelDeferralBatchRevoke = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich(
            "balances.actions.batchRevokeDeferral.cancel.confirm",
            {
              bold: (chunks) => <strong>{chunks}</strong>,
            },
          )}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(false);
        clearRowSelection();

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("balances.actions.batchRevokeDeferral.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tAttendance]);

  const leaveTypeOptions = useMemo(
    () =>
      leaveTypes.map((leaveType) => ({
        label: getStatutoryLeaveName(tAttendance, leaveType),
        value: leaveType.name,
      })),
    [leaveTypes, tAttendance],
  );

  const canBatchRevoke = canViewAll && canRevokeDeferral;

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(canViewAll &&
      (canDefer || canRevokeDeferral || canViewAuditLog) &&
      !isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceLeaveBalance>) => {
                if (!row.statutory)
                  return (
                    canViewAuditLog && <AuditLogButton resourceId={row.id} />
                  );

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
              resizable: false,
              sortable: false,
            } satisfies GridColDef,
          ]
        : []),
      ...(canViewAll
        ? [
            {
              field: "employeeName",
              filterOperators: stringFilterOperators,
              headerName: tAttendance("employee"),
              renderCell: renderEmptyableCell,
            },
            {
              field: "employeeEmail",
              filterOperators: stringFilterOperators,
              headerName: tAttendance("account"),
              renderCell: renderEmptyableCell,
            },
          ]
        : []),
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
        valueFormatter: (value: number) => String(value),
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
    ],
    [
      canDefer,
      canRevokeDeferral,
      canViewAll,
      canViewAuditLog,
      date,
      dateFilterOperators,
      durationFilterOperators,
      enumFilterOperators,
      handleDefer,
      handleRevokeDeferral,
      isSelectMode,
      leaveTypeOptions,
      numberFilterOperators,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {(canWrite || canBatchRevoke) && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <>
              {canWrite && (
                <Button
                  onClick={handleCreateBalance}
                  size="small"
                  startIcon={<Add />}
                  variant="contained"
                >
                  {tAttendance("balances.actions.create")}
                </Button>
              )}
              {canBatchRevoke && (
                <Button
                  disabled={!hasSelectableRows}
                  onClick={handleEnterDeferralBatchRevokeMode}
                  size="small"
                  startIcon={<EventBusy />}
                  variant="outlined"
                >
                  {tAttendance("balances.actions.batchRevokeDeferral.title")}
                </Button>
              )}
            </>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelDeferralBatchRevoke}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tAttendance(
                  "balances.actions.batchRevokeDeferral.cancel.label",
                )}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitDeferralBatchRevoke}
                size="small"
                startIcon={<EventBusy />}
                variant="contained"
              >
                {tAttendance(
                  "balances.actions.batchRevokeDeferral.submit.label",
                  { count: selectedRows.length },
                )}
              </Button>
            </>
          )}
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        {...rowSelectionProps}
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
    </>
  );
};

export default Balances;
