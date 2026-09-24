"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import ShiftDialog from "../../ShiftDialog";

import EventsDialogContent from "../../EventsDialogContent";

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

import { Add, Cancel, History } from "@mui/icons-material";
import { Button, Chip, IconButton, Stack, Tooltip } from "@mui/material";
import { styled } from "@mui/material/styles";
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
  AttendanceShift,
  AttendanceShiftFilterField,
  AttendanceShiftPage,
  AttendanceShiftSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import {
  attendanceErrorKey,
  attendancePath,
  formatClockedShift,
  formatScheduledShift,
} from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
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
  employees: AttendanceEmployee[];
  filterField?: AttendanceShiftFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  openingHours: string;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceShift[];
  sortBy?: AttendanceShiftSortField;
  sortDirection?: SortDirection;
}

const Shifts = ({
  canCancel,
  canCreate,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  openingHours,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
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
    [base, paginationModel, filterModel, sortModel],
    () =>
      fetcher<AttendanceShiftPage>(
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
          />
        ),
        formId: "attendance-shift-form",
        open: true,
        title: tAttendance("shifts.actions.create"),
      }),
    [employees, mutate, openingHours, organizationSlug, setDialog, tAttendance],
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
    ({ id }: AttendanceShift) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(`${base}/${id}/cancel`, { method: "PATCH" });

            enqueueSnackbar(tAttendance("success"), { variant: "success" });
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
            <Tooltip title={tAttendance("shifts.actions.viewEvents")}>
              <IconButton onClick={() => handleViewEvents(row)} size="small">
                <History fontSize="small" />
              </IconButton>
            </Tooltip>
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
      handleCancelShift,
      handleViewEvents,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {canCreate && (
        <ToolbarStack direction="row">
          <Button
            onClick={handleCreateShift}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tAttendance("shifts.actions.create")}
          </Button>
        </ToolbarStack>
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

export default Shifts;
