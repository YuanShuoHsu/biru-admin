"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import PunchCard from "./PunchCard";

import CorrectionDialog from "../../CorrectionDialog";
import EventsDialogContent from "../../EventsDialogContent";
import OvertimeDialog from "../../OvertimeDialog";

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
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { EditNote, History, MoreTime } from "@mui/icons-material";
import { Alert, Chip, IconButton, Stack, Tooltip } from "@mui/material";
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
  AttendanceShift,
  AttendanceShiftFilterField,
  AttendanceShiftPage,
  AttendanceShiftSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceDayKindEnumOptions } from "@/utils/enumOptions";
import {
  attendancePath,
  formatClockedShift,
  formatScheduledShift,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

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

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface MineProps {
  enabled: boolean;
  filterField?: AttendanceShiftFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  punchableShifts: AttendanceShift[];
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceShift[];
  sortBy?: AttendanceShiftSortField;
  sortDirection?: SortDirection;
}

const Mine = ({
  enabled,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { slug: organizationSlug },
  page,
  pageSize,
  punchableShifts,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: MineProps) => {
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

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getAttendanceDayKindEnumOptions(tAttendance),
    [tAttendance],
  );

  const resource = attendancePath(organizationSlug, "me", "shifts");

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
    mutate,
  } = useSWR(
    enabled ? [resource, paginationModel, filterModel, sortModel] : null,
    () =>
      fetcher<AttendanceShiftPage>(
        `${resource}?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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

  const handleCorrection = useCallback(
    (shift: AttendanceShift) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <CorrectionDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            shift={shift}
          />
        ),
        formId: "attendance-correction-form",
        open: true,
        title: tAttendance("kind.options.correction"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleOvertime = useCallback(
    (shift: AttendanceShift) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <OvertimeDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            shift={shift}
          />
        ),
        formId: "attendance-overtime-form",
        open: true,
        title: tAttendance("kind.options.overtime"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
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
              <Tooltip title={tAttendance("mine.actions.viewEvents")}>
                <StyledIconButton
                  onClick={() => handleViewEvents(row)}
                  size="small"
                  visible={!!row.originalEvents}
                >
                  <History fontSize="small" />
                </StyledIconButton>
              </Tooltip>
            )}
            <Tooltip
              title={tAttendance(
                dayjs(row.startsAt).isAfter(dayjs())
                  ? "mine.correctionNotStarted"
                  : "kind.options.correction",
              )}
            >
              <span>
                <IconButton
                  disabled={dayjs(row.startsAt).isAfter(dayjs())}
                  onClick={() => handleCorrection(row)}
                  size="small"
                >
                  <EditNote fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={tAttendance("kind.options.overtime")}>
              <IconButton onClick={() => handleOvertime(row)} size="small">
                <MoreTime fontSize="small" />
              </IconButton>
            </Tooltip>
          </ActionsStack>
        ),
        resizable: false,
        sortable: false,
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
        valueFormatter: (value: AttendanceShift["state"]) =>
          tAttendance(`state.options.${value}`),
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
      dateFilterOperators,
      enumFilterOperators,
      enumOptions.dayKind,
      format,
      handleCorrection,
      handleOvertime,
      handleViewEvents,
      hasCorrectedShift,
      tAttendance,
    ],
  );

  return (
    <>
      {enabled ? (
        <PunchCard
          onPunched={() => mutate()}
          organizationSlug={organizationSlug}
          shifts={punchableShifts}
        />
      ) : (
        <Alert severity="info">
          {tAttendance("errors.employeeNotEnabled")}
        </Alert>
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

export default Mine;
