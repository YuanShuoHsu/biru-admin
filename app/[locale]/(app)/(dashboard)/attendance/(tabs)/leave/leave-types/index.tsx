"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import LeaveTypeDialog from "./LeaveTypeDialog";

import AuditLogButton from "@/components/AuditLogButton";
import DataGrid from "@/components/DataGrid";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import {
  useBooleanFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Cancel, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  Chip,
  DialogContentText,
  IconButton,
  Stack,
  Tooltip,
} from "@mui/material";
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
  AttendanceLeaveType,
  AttendanceLeaveTypeFilterField,
  AttendanceLeaveTypePage,
  AttendanceLeaveTypeSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendancePath, getStatutoryLeaveName } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceLeaveTypeEnumOptions } from "@/utils/enumOptions";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const PaidPercentStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface LeaveTypesProps {
  canViewAuditLog?: boolean;
  filterField?: AttendanceLeaveTypeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: AttendanceLeaveType[];
  sortBy?: AttendanceLeaveTypeSortField;
  sortDirection?: SortDirection;
}

const LeaveTypes = ({
  canViewAuditLog = false,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: LeaveTypesProps) => {
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
    isValidating,
    mutate,
  } = useSWR(
    !loading && [base, paginationModel, filterModel, sortModel],
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

  const isLeaveTypeSelectable = useCallback(
    ({ statutoryKind }: AttendanceLeaveType) => statutoryKind === "custom",
    [],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isLeaveTypeSelectable,
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
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("leaveTypes.actions.delete.title"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleEnterLeaveTypeBatchDeleteMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("leaveTypes.actions.batchDelete.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("leaveTypes.actions.batchDelete.title"),
    });
  }, [apiRef, setDialog, tAttendance]);

  const handleSubmitLeaveTypeBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("leaveTypes.actions.batchDelete.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(base, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
          });

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tAttendance("leaveTypes.actions.batchDelete.submit.success", {
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
      title: tAttendance("leaveTypes.actions.batchDelete.submit.label", {
        count,
      }),
    });
  }, [
    apiRef,
    base,
    clearRowSelection,
    mutate,
    selectedRows,
    setDialog,
    tAttendance,
  ]);

  const handleCancelLeaveTypeBatchDelete = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("leaveTypes.actions.batchDelete.cancel.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(false);
        clearRowSelection();

        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("leaveTypes.actions.batchDelete.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tAttendance]);

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(!isSelectMode
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceLeaveType>) => (
                <ActionsStack direction="row">
                  <Tooltip
                    title={tAttendance("leaveTypes.actions.update.title")}
                  >
                    <IconButton
                      onClick={() => handleLeaveTypeDialog(row)}
                      size="small"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                  {isLeaveTypeSelectable(row) && (
                    <Tooltip
                      title={tAttendance("leaveTypes.actions.delete.title")}
                    >
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteLeaveType(row)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </ActionsStack>
              ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
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
          <PaidPercentStack direction="row">
            {paidPercent ?? statutoryPaidPercent}
            {paidPercent != null && statutoryPaidPercent != null && (
              <Chip
                color="info"
                label={tAttendance("aboveStatutory")}
                size="small"
                variant="outlined"
              />
            )}
          </PaidPercentStack>
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
            <Chip
              label={tAttendance("byStatute")}
              size="small"
              variant="outlined"
            />
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
      canViewAuditLog,
      enumFilterOperators,
      enumOptions.statutoryKind,
      handleDeleteLeaveType,
      handleLeaveTypeDialog,
      isLeaveTypeSelectable,
      isSelectMode,
      numberFilterOperators,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        {!isSelectMode && (
          <>
            <Button
              disabled={loading}
              onClick={() => handleLeaveTypeDialog()}
              size="small"
              startIcon={<Add />}
              variant="contained"
            >
              {tAttendance("leaveTypes.actions.create.title")}
            </Button>
            <Button
              disabled={!hasSelectableRows}
              onClick={handleEnterLeaveTypeBatchDeleteMode}
              size="small"
              startIcon={<Delete />}
              variant="outlined"
            >
              {tAttendance("leaveTypes.actions.batchDelete.title")}
            </Button>
          </>
        )}
        {isSelectMode && (
          <>
            <Button
              onClick={handleCancelLeaveTypeBatchDelete}
              size="small"
              startIcon={<Cancel />}
              variant="outlined"
            >
              {tAttendance("leaveTypes.actions.batchDelete.cancel.label")}
            </Button>
            <Button
              color="error"
              disabled={!selectedRows.length}
              onClick={handleSubmitLeaveTypeBatchDelete}
              size="small"
              startIcon={<Delete />}
              variant="contained"
            >
              {tAttendance("leaveTypes.actions.batchDelete.submit.label", {
                count: selectedRows.length,
              })}
            </Button>
          </>
        )}
      </ToolbarStack>
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

export default LeaveTypes;
