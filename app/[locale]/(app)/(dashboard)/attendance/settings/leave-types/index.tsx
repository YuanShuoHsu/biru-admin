"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import LeaveTypeDialog from "./LeaveTypeDialog";

import EmptyCell from "@/components/EmptyCell";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useBooleanFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
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

import type {
  AttendanceLeaveType,
  AttendanceLeaveTypeFilterField,
  AttendanceLeaveTypePage,
  AttendanceLeaveTypeSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceLeaveTypeEnumOptions } from "@/utils/enumOptions";
import {
  attendanceErrorKey,
  attendancePath,
  getStatutoryLeaveName,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface LeaveTypesProps {
  filterField?: AttendanceLeaveTypeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceLeaveType[];
  sortBy?: AttendanceLeaveTypeSortField;
  sortDirection?: SortDirection;
}

const LeaveTypes = ({
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
}: LeaveTypesProps) => {
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
  const enumFilterOperators = useEnumFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getAttendanceLeaveTypeEnumOptions(tAttendance),
    [tAttendance],
  );

  const base = attendancePath(organizationSlug, "org", "leave-types");

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
      fetcher<AttendanceLeaveTypePage>(
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

  const handleLeaveTypeDialog = useCallback(
    (leaveType?: AttendanceLeaveType) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <LeaveTypeDialog
            leaveType={leaveType}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-leave-type-form",
        open: true,
        title: tAttendance(
          leaveType
            ? "leaveTypes.actions.update.title"
            : "leaveTypes.actions.create.title",
        ),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleDeleteLeaveType = useCallback(
    ({ id, name }: AttendanceLeaveType) =>
      setDialog({
        content: (
          <DialogContentText>
            {tAttendance.rich("leaveTypes.actions.delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(organizationSlug, "org", `leave-types/${id}`),
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tAttendance("leaveTypes.actions.delete.success", { name }),
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
        title: tAttendance("leaveTypes.actions.delete.title"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({ row }: GridRenderCellParams<AttendanceLeaveType>) => (
          <Stack height="100%" direction="row" alignItems="center">
            <Tooltip title={tAttendance("leaveTypes.actions.update.title")}>
              <IconButton
                onClick={() => handleLeaveTypeDialog(row)}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            {row.statutoryKind === "custom" && (
              <Tooltip title={tAttendance("leaveTypes.actions.delete.title")}>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteLeaveType(row)}
                  size="small"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("name"),
        renderCell: ({ row }: GridRenderCellParams<AttendanceLeaveType>) =>
          getStatutoryLeaveName(tAttendance, row),
      },
      {
        field: "statutoryKind",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("statutoryKind.label"),
        type: "singleSelect",
        valueOptions: enumOptions.statutoryKind,
      },
      {
        field: "paidPercent",
        filterOperators: numberFilterOperators,
        headerName: tAttendance("paidPercent"),
        renderCell: ({
          row: { paidPercent, statutoryPaidPercent },
        }: GridRenderCellParams<AttendanceLeaveType>) => (
          <Stack height="100%" direction="row" alignItems="center" gap={1}>
            {paidPercent ?? statutoryPaidPercent}
            {paidPercent != null && statutoryPaidPercent != null && (
              <Chip
                color="info"
                label={tAttendance("aboveStatutory")}
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        ),
        type: "number",
      },
      {
        field: "requiresBalance",
        filterOperators: booleanFilterOperators,
        headerName: tAttendance("requiresBalance"),
        type: "boolean",
        renderCell: ({
          row: { requiresBalance },
        }: GridRenderCellParams<AttendanceLeaveType>) =>
          requiresBalance == null ? (
            <EmptyCell />
          ) : (
            <Chip
              color={requiresBalance ? "success" : "default"}
              label={tAttendance(requiresBalance ? "yes" : "no")}
              size="small"
              variant="outlined"
            />
          ),
      },
      {
        field: "enabled",
        filterOperators: booleanFilterOperators,
        headerName: tAttendance("enabled"),
        type: "boolean",
        renderCell: ({
          row: { enabled },
        }: GridRenderCellParams<AttendanceLeaveType>) => (
          <Chip
            color={enabled ? "success" : "default"}
            label={tAttendance(enabled ? "enabled" : "disabled")}
            size="small"
            variant="outlined"
          />
        ),
      },
    ],
    [
      booleanFilterOperators,
      enumFilterOperators,
      enumOptions.statutoryKind,
      handleDeleteLeaveType,
      handleLeaveTypeDialog,
      numberFilterOperators,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      <Button
        onClick={() => handleLeaveTypeDialog()}
        startIcon={<Add />}
        sx={{ alignSelf: "flex-start" }}
        variant="contained"
      >
        {tAttendance("leaveTypes.actions.create.title")}
      </Button>
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

export default LeaveTypes;
