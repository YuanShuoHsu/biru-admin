"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import LeaveDialog from "./LeaveDialog";
import ReturnDialog from "./ReturnDialog";
import ShiftRequestDialog from "./ShiftRequestDialog";

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

import { Add, AssignmentReturn, Cancel, Undo } from "@mui/icons-material";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  styled,
  Tooltip,
} from "@mui/material";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceRequestKindValues } from "@/types/api";

import type {
  AttendanceLeaveCase,
  AttendanceLeaveType,
  AttendanceRequest,
  AttendanceRequestFilterField,
  AttendanceRequestKind,
  AttendanceRequestPage,
  AttendanceRequestSortField,
  AttendanceShift,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceRequestEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

interface RequestsProps {
  enabled: boolean;
  filterField?: AttendanceRequestFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveCases: AttendanceLeaveCase[];
  leaveTypes: AttendanceLeaveType[];
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceRequest[];
  shifts: AttendanceShift[];
  sortBy?: AttendanceRequestSortField;
  sortDirection?: SortDirection;
}

const Requests = ({
  enabled,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveCases,
  leaveTypes,
  organizationSlug,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  shifts,
  sortBy,
  sortDirection,
}: RequestsProps) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );

  const [kindMenuTrigger, setKindMenuTrigger] = useState<HTMLElement | null>(
    null,
  );

  const kindMenuOpen = Boolean(kindMenuTrigger);

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
    () => getAttendanceRequestEnumOptions(tAttendance),
    [tAttendance],
  );

  const resource = attendancePath(organizationSlug, "me", "requests");

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
      fetcher<AttendanceRequestPage>(
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

  const correctableShifts = useMemo(
    () => shifts.filter(({ startsAt }) => new Date(startsAt) <= new Date()),
    [shifts],
  );

  const handleCreateRequest = useCallback(
    (kind: AttendanceRequestKind) => {
      setKindMenuTrigger(null);

      const shiftRequestShifts =
        kind === "correction" ? correctableShifts : shifts;

      setDialog({
        confirmDisabled: kind !== "leave" && !shiftRequestShifts.length,
        confirmText: tAttendance("save"),
        content:
          kind === "leave" ? (
            <LeaveDialog
              leaveCases={leaveCases}
              leaveTypes={leaveTypes}
              mutate={mutate}
              organizationSlug={organizationSlug}
            />
          ) : (
            <ShiftRequestDialog
              kind={kind}
              mutate={mutate}
              organizationSlug={organizationSlug}
              shifts={shiftRequestShifts}
            />
          ),
        formId: `attendance-${kind}-form`,
        open: true,
        title: tAttendance(`kind.options.${kind}`),
      });
    },
    [
      correctableShifts,
      leaveCases,
      leaveTypes,
      mutate,
      organizationSlug,
      setDialog,
      shifts,
      tAttendance,
    ],
  );

  const handleReturn = useCallback(
    (request: AttendanceRequest) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <ReturnDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            request={request}
          />
        ),
        formId: "attendance-return-form",
        open: true,
        title: tAttendance("parentalReturn"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleWithdraw = useCallback(
    ({ id, status }: AttendanceRequest) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(
                organizationSlug,
                "org",
                `requests/${id}/withdraw`,
              ),
              { method: "PATCH" },
            );

            enqueueSnackbar(tAttendance("success"), { variant: "success" });
            mutate();
          } catch (error) {
            enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance(status === "approved" ? "cancelLeave" : "withdraw"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "short"),
    [format],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({ row }: GridRenderCellParams<AttendanceRequest>) =>
          row.status === "pending" ||
          (row.kind === "leave" && row.status === "approved") ? (
            <Stack height="100%" direction="row" alignItems="center" gap={1}>
              <Tooltip title={tAttendance("parentalReturn")}>
                <span>
                  <StyledIconButton
                    disabled={
                      row.returnPending || dayjs(row.endsAt).isBefore(dayjs())
                    }
                    onClick={() => handleReturn(row)}
                    size="small"
                    visible={row.status === "approved" && !!row.parentalMode}
                  >
                    <AssignmentReturn fontSize="small" />
                  </StyledIconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={tAttendance(
                  row.status === "approved" ? "cancelLeave" : "withdraw",
                )}
              >
                <span>
                  <IconButton
                    color={row.status === "approved" ? "error" : undefined}
                    disabled={row.returnPending}
                    onClick={() => handleWithdraw(row)}
                    size="small"
                  >
                    {row.status === "approved" ? (
                      <Cancel fontSize="small" />
                    ) : (
                      <Undo fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ) : null,
        resizable: false,
        sortable: false,
      },
      {
        field: "kind",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("kind.label"),
        type: "singleSelect",
        valueOptions: enumOptions.kind,
      },
      {
        field: "leaveTypeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("leaveType"),
        renderCell: renderEmptyableCell,
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
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("status.label"),
        type: "singleSelect",
        valueOptions: enumOptions.status,
        renderCell: ({ row }: GridRenderCellParams<AttendanceRequest>) => (
          <Chip
            color={
              row.status === "approved"
                ? "success"
                : row.status === "rejected"
                  ? "error"
                  : "default"
            }
            label={tAttendance(`status.options.${row.status}`)}
            size="small"
          />
        ),
      },
      {
        field: "reason",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("reason"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "reviewReason",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("reviewReason"),
        renderCell: renderEmptyableCell,
      },
    ],
    [
      date,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions.kind,
      enumOptions.status,
      handleReturn,
      handleWithdraw,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {!enabled && (
        <Alert severity="info">
          {tAttendance("errors.employeeNotEnabled")}
        </Alert>
      )}
      <Button
        aria-controls="attendance-request-kind-menu"
        aria-expanded={kindMenuOpen ? "true" : undefined}
        aria-haspopup="true"
        disabled={!enabled}
        id="attendance-request-kind-menu-trigger"
        onClick={({ currentTarget }) => setKindMenuTrigger(currentTarget)}
        size="small"
        startIcon={<Add />}
        sx={{ alignSelf: "flex-start" }}
        variant="contained"
      >
        {tAttendance("requests.actions.create")}
      </Button>
      <Menu
        anchorEl={kindMenuTrigger}
        id="attendance-request-kind-menu"
        onClose={() => setKindMenuTrigger(null)}
        open={kindMenuOpen}
        slotProps={{
          list: { "aria-labelledby": "attendance-request-kind-menu-trigger" },
        }}
      >
        {attendanceRequestKindValues.map((value) => (
          <MenuItem key={value} onClick={() => handleCreateRequest(value)}>
            {tAttendance(`kind.options.${value}`)}
          </MenuItem>
        ))}
      </Menu>
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

export default Requests;
