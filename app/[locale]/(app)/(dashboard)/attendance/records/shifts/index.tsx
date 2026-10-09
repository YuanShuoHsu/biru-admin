"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as mutateCache } from "swr";

import ShiftDialog from "../../ShiftDialog";

import BatchReviewDialog from "../../BatchReviewDialog";
import EventsDialogContent from "../../EventsDialogContent";
import ReviewDialog from "../reviews/ReviewDialog";

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
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";
import { attendanceReviewCountsKey } from "@/hooks/useAttendanceReviewCounts";

import { Add, Cancel, Check, Close, History } from "@mui/icons-material";
import { Button, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridRowSelectionModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  AttendanceShift,
  AttendanceShiftFilterField,
  AttendanceShiftPage,
  AttendanceShiftSortField,
  AttendanceShiftType,
  AttendanceTeam,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  attendanceErrorKey,
  attendancePath,
  formatClockedShift,
  formatScheduledShift,
} from "@/utils/attendance";
import {
  getDataGridSearchParams,
  getFilterItemParams,
  getSelectedRows,
} from "@/utils/dataGrid";
import { getAttendanceDayKindEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const ActionsStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const ChipsStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(0.5),
  height: "100%",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

interface ShiftsProps {
  canCancel: boolean;
  canCreate: boolean;
  canReviewExtraWork: boolean;
  employees: AttendanceEmployee[];
  filterField?: AttendanceShiftFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceShift[];
  shiftTypes: AttendanceShiftType[];
  sortBy?: AttendanceShiftSortField;
  sortDirection?: SortDirection;
  teams: AttendanceTeam[];
  unreviewedOvertime: boolean;
}

const Shifts = ({
  canCancel,
  canCreate,
  canReviewExtraWork,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { openingHours = "", slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  shiftTypes,
  sortBy,
  sortDirection,
  teams,
  unreviewedOvertime: initialUnreviewedOvertime,
}: ShiftsProps) => {
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

  const [unreviewedOvertime, setUnreviewedOvertime] = useState(
    initialUnreviewedOvertime,
  );

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });

  const { setDialog } = useDialogStore((state) => state);

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getAttendanceDayKindEnumOptions(tAttendance),
    [tAttendance],
  );

  const base = attendancePath(organizationSlug, "org", "shifts");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR(
    [base, paginationModel, filterModel, sortModel, unreviewedOvertime],
    () => {
      const params = getDataGridSearchParams(
        paginationModel,
        filterModel,
        sortModel,
        enumOptions,
      );

      if (unreviewedOvertime) params.set("unreviewedOvertime", "true");

      return fetcher<AttendanceShiftPage>(`${base}?${params}`);
    },
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
        mutateCache(attendanceReviewCountsKey(organizationSlug));
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

  const handleToggleUnreviewedOvertime = useCallback(() => {
    setUnreviewedOvertime(!unreviewedOvertime);
    setPaginationModel((previous) => ({ ...previous, page: 0 }));

    updateQuery({
      page: "1",
      unreviewedOvertime: unreviewedOvertime ? "" : "true",
    });
  }, [unreviewedOvertime, updateQuery]);

  const handleCreateShift = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <ShiftDialog
            employees={employees}
            mutate={mutate}
            openingHours={openingHours}
            organizationSlug={organizationSlug}
            shiftTypes={shiftTypes}
            teams={teams}
          />
        ),
        formId: "attendance-shift-form",
        open: true,
        title: tAttendance("shifts.actions.create"),
      }),
    [
      employees,
      mutate,
      openingHours,
      organizationSlug,
      setDialog,
      shiftTypes,
      tAttendance,
      teams,
    ],
  );

  const handleViewEvents = useCallback(
    (shift: AttendanceShift) =>
      setDialog({
        content: <EventsDialogContent shift={shift} />,
        open: true,
        showConfirm: false,
        title: tAttendance("events"),
      }),
    [setDialog, tAttendance],
  );

  const handleCancelShift = useCallback(
    ({ employeeName, id }: AttendanceShift) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(`${base}/${id}/cancel`, { method: "PATCH" });

            enqueueSnackbar(
              tAttendance("schedule.shiftCancelled", { name: employeeName }),
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
        title: tAttendance("cancelShift"),
      }),
    [base, mutate, setDialog, tAttendance],
  );

  const handleReviewExtraWork = useCallback(
    (shift: AttendanceShift, status: "approved" | "rejected") =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <ReviewDialog
            extraWork={{ shift, ...shift.unreviewedOvertime[0] }}
            mutate={mutate}
            organizationSlug={organizationSlug}
            status={status}
          />
        ),
        formId: "attendance-review-form",
        open: true,
        title: tAttendance(
          status === "approved"
            ? "shifts.actions.approveExtraWork"
            : "shifts.actions.rejectExtraWork",
        ),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const hasExtraWork = useMemo(
    () => rows.some(({ unreviewedOvertime }) => unreviewedOvertime.length),
    [rows],
  );

  const selectedRows = useMemo(
    () =>
      getSelectedRows(rows, rowSelectionModel).filter(
        ({ unreviewedOvertime }) => unreviewedOvertime.length,
      ),
    [rowSelectionModel, rows],
  );

  const handleBatchReviewExtraWork = useCallback(
    (status: "approved" | "rejected") =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <BatchReviewDialog
            labels={Object.fromEntries(
              selectedRows.map((shift) => [
                shift.id,
                `${shift.employeeName} · ${formatScheduledShift(format, shift)}`,
              ]),
            )}
            method="POST"
            mutate={() => {
              setRowSelectionModel({ ids: new Set(), type: "include" });

              mutate();
            }}
            path={`${base}/extra-work-reviews`}
            status={status}
          />
        ),
        formId: "attendance-batch-review-form",
        open: true,
        title: tAttendance(
          status === "approved"
            ? "shifts.actions.approveSelectedExtraWork"
            : "shifts.actions.rejectSelectedExtraWork",
          { count: selectedRows.length },
        ),
      }),
    [base, format, mutate, selectedRows, setDialog, tAttendance],
  );

  const hasCorrectedShift = useMemo(
    () => rows.some(({ originalEvents }) => originalEvents),
    [rows],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({ row }: GridRenderCellParams<AttendanceShift>) => (
          <ActionsStack direction="row">
            {hasCorrectedShift && (
              <Tooltip title={tAttendance("shifts.actions.viewEvents")}>
                <StyledIconButton
                  onClick={() => handleViewEvents(row)}
                  size="small"
                  visible={!!row.originalEvents}
                >
                  <History fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
            {canReviewExtraWork &&
              hasExtraWork &&
              (["approved", "rejected"] as const).map((status) => (
                <Tooltip
                  key={status}
                  title={tAttendance(
                    status === "approved"
                      ? "shifts.actions.approveExtraWork"
                      : "shifts.actions.rejectExtraWork",
                  )}
                >
                  <StyledIconButton
                    color={status === "approved" ? "success" : "error"}
                    onClick={() => handleReviewExtraWork(row, status)}
                    size="small"
                    visible={row.unreviewedOvertime.length > 0}
                  >
                    {status === "approved" ? (
                      <Check fontSize="small" />
                    ) : (
                      <Close fontSize="small" />
                    )}
                  </StyledIconButton>
                </Tooltip>
              ))}
            {canCancel && (
              <Tooltip title={tAttendance("cancelShift")}>
                <StyledIconButton
                  color="error"
                  onClick={() => handleCancelShift(row)}
                  size="small"
                  visible={row.state === "scheduled"}
                >
                  <Cancel fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
          </ActionsStack>
        ),
        resizable: false,
        sortable: false,
      },
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
      {
        field: "teamName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("team"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "startsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("scheduledTime"),
        valueFormatter: (_value, row: AttendanceShift) =>
          formatScheduledShift(format, row),
      },
      {
        field: "clockInAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("clockedTime"),
        renderCell: renderEmptyableCell,
        valueFormatter: (_value, row: AttendanceShift) =>
          formatClockedShift(format, row),
      },
      {
        field: "dayKind",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("dayKind.label"),
        type: "singleSelect",
        valueOptions: enumOptions.dayKind,
      },
      {
        field: "state",
        filterable: false,
        headerName: tAttendance("state.label"),
        renderCell: ({ row }: GridRenderCellParams<AttendanceShift>) => (
          <ChipsStack direction="row">
            <Chip
              color={row.state === "working" ? "success" : "default"}
              label={tAttendance(`state.options.${row.state}`)}
              size="small"
            />
            {row.late && (
              <Chip color="warning" label={tAttendance("late")} size="small" />
            )}
            {row.early && (
              <Chip color="error" label={tAttendance("early")} size="small" />
            )}
            {row.absent && (
              <Chip color="error" label={tAttendance("absent")} size="small" />
            )}
            {row.missingClockOut && (
              <Chip
                color="warning"
                label={tAttendance("missingClockOut")}
                size="small"
              />
            )}
          </ChipsStack>
        ),
      },
      {
        field: "workedSeconds",
        filterable: false,
        headerName: tAttendance("worked"),
        sortable: false,
        type: "number",
        valueFormatter: (value: number) =>
          format.number(value / 3600, { maximumFractionDigits: 2 }),
      },
      {
        field: "breakSeconds",
        filterable: false,
        headerName: tAttendance("breaks"),
        sortable: false,
        type: "number",
        valueFormatter: (value: number) =>
          format.number(value / 60, { maximumFractionDigits: 1 }),
      },
    ],
    [
      canCancel,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions.dayKind,
      format,
      canReviewExtraWork,
      handleCancelShift,
      handleReviewExtraWork,
      handleViewEvents,
      hasCorrectedShift,
      hasExtraWork,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {(canCreate || canReviewExtraWork) && (
        <ToolbarStack direction="row">
          {canReviewExtraWork && (
            <Chip
              color={unreviewedOvertime ? "primary" : "default"}
              label={tAttendance("shifts.unreviewedOvertime")}
              onClick={handleToggleUnreviewedOvertime}
              variant={unreviewedOvertime ? "filled" : "outlined"}
            />
          )}
          {canReviewExtraWork && hasExtraWork && (
            <>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={() => handleBatchReviewExtraWork("rejected")}
                size="small"
              >
                {tAttendance("shifts.actions.rejectSelectedExtraWork", {
                  count: selectedRows.length,
                })}
              </Button>
              <Button
                disabled={!selectedRows.length}
                onClick={() => handleBatchReviewExtraWork("approved")}
                size="small"
              >
                {tAttendance("shifts.actions.approveSelectedExtraWork", {
                  count: selectedRows.length,
                })}
              </Button>
            </>
          )}
          {canCreate && (
            <Button
              onClick={handleCreateShift}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tAttendance("shifts.actions.create")}
            </Button>
          )}
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        checkboxSelection={canReviewExtraWork && hasExtraWork}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        isRowSelectable={({ row }) => row.unreviewedOvertime.length > 0}
        loading={loading}
        onFilterModelChange={handleFilterModelChange}
        onPaginationModelChange={handlePaginationModelChange}
        onRowSelectionModelChange={setRowSelectionModel}
        onSortModelChange={handleSortModelChange}
        rowSelectionModel={rowSelectionModel}
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
            exportDateField: "startsAt",
          },
        }}
      />
    </>
  );
};

export default Shifts;
