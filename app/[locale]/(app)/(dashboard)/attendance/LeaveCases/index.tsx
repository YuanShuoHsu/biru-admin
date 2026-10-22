"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import AssignChildDialog from "./AssignChildDialog";
import LeaveCaseDialog from "../LeaveCaseDialog";

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
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Cancel, ChildCare, Delete, Edit } from "@mui/icons-material";
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
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployeeSummary,
  AttendanceLeaveCase,
  AttendanceLeaveCaseFilterField,
  AttendanceLeaveCasePage,
  AttendanceLeaveCaseSortField,
  AttendanceLeaveType,
  AttendanceParentalChild,
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

const StyledStack = styled(Stack)({
  alignItems: "center",
  height: "100%",
});

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface LeaveCasesProps {
  canAssignChild?: boolean;
  canDelete?: boolean;
  canUpdate?: boolean;
  canViewAll?: boolean;
  canViewAuditLog?: boolean;
  canWrite?: boolean;
  canReviewOwn?: boolean;
  employeeId?: string;
  employees?: AttendanceEmployeeSummary[];
  filterField?: AttendanceLeaveCaseFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveTypes?: AttendanceLeaveType[];
  loading?: boolean;
  organization?: Organization;
  page?: number;
  pageSize?: number;
  parentalChildren?: AttendanceParentalChild[];
  quickFilterValue?: string;
  rowCount?: number;
  rows?: AttendanceLeaveCase[];
  sortBy?: AttendanceLeaveCaseSortField;
  sortDirection?: SortDirection;
}

const LeaveCases = ({
  canAssignChild = false,
  canDelete = false,
  canUpdate = false,
  canViewAll = false,
  canViewAuditLog = false,
  canWrite = false,
  canReviewOwn = false,
  employeeId,
  employees = [],
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes = [],
  loading = false,
  organization,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  parentalChildren = [],
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: LeaveCasesProps) => {
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
    "leave-cases",
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

  const handleLeaveCaseDialog = useCallback(
    (leaveCase?: AttendanceLeaveCase) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <LeaveCaseDialog
            employeeId={canReviewOwn ? undefined : employeeId}
            employees={employees}
            leaveCase={leaveCase}
            leaveTypes={leaveTypes}
            mutate={mutate}
            organizationSlug={organizationSlug}
            parentalChildren={parentalChildren}
          />
        ),
        formId: "attendance-leave-case-form",
        open: true,
        title: tAttendance(
          leaveCase ? "leaveCases.actions.update" : "leaveCases.actions.create",
        ),
      }),
    [
      canReviewOwn,
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

  const handleDeleteLeaveCase = useCallback(
    ({
      employeeName,
      id,
      leaveTypeName,
      leaveTypeStatutoryKind,
    }: AttendanceLeaveCase) =>
      setDialog({
        content: (
          <DialogContentText>
            {tAttendance.rich("leaveCases.deleteConfirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              leaveType: getStatutoryLeaveName(tAttendance, {
                name: leaveTypeName,
                statutoryKind: leaveTypeStatutoryKind,
              }),
              name: employeeName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(organizationSlug, "org", `leave-cases/${id}`),
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tAttendance("leaveCases.deleted", {
                leaveType: getStatutoryLeaveName(tAttendance, {
                  name: leaveTypeName,
                  statutoryKind: leaveTypeStatutoryKind,
                }),
                name: employeeName,
              }),
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
        title: tAttendance("leaveCases.actions.delete"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
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

  const getRowActions = useCallback(
    (row: AttendanceLeaveCase) => {
      const own = !canReviewOwn && row.employeeId === employeeId;

      return {
        assignChild:
          canAssignChild &&
          isParentalLeave(row.leaveTypeId) &&
          !own &&
          !row.childId,
        delete: canDelete && !own && !row.usedMinutes,
        update: canUpdate && !own,
      };
    },
    [
      canAssignChild,
      canDelete,
      canReviewOwn,
      canUpdate,
      employeeId,
      isParentalLeave,
    ],
  );

  const isLeaveCaseSelectable = useCallback(
    (row: AttendanceLeaveCase) => getRowActions(row).delete,
    [getRowActions],
  );

  const {
    clearRowSelection,
    hasSelectableRows,
    rowSelectionProps,
    selectedRows,
  } = useRowSelection({
    enabled: isSelectMode,
    isRowSelectable: isLeaveCaseSelectable,
    rows,
  });

  const handleEnterLeaveCaseBatchDeleteMode = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("leaveCases.actions.batchDelete.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        setIsSelectMode(true);
        setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);
      },
      open: true,
      title: tAttendance("leaveCases.actions.batchDelete.title"),
    });
  }, [apiRef, setDialog, tAttendance]);

  const handleSubmitLeaveCaseBatchDelete = useCallback(() => {
    const count = selectedRows.length;

    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("leaveCases.actions.batchDelete.submit.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count,
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(
            attendancePath(organizationSlug, "org", "leave-cases"),
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids: selectedRows.map(({ id }) => id) }),
            },
          );

          setIsSelectMode(false);
          clearRowSelection();

          setTimeout(() => apiRef.current?.autosizeColumns(autosizeOptions), 0);

          enqueueSnackbar(
            tAttendance("leaveCases.actions.batchDelete.submit.success", {
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
      title: tAttendance("leaveCases.actions.batchDelete.submit.label", {
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

  const handleCancelLeaveCaseBatchDelete = useCallback(() => {
    setDialog({
      content: (
        <DialogContentText>
          {tAttendance.rich("leaveCases.actions.batchDelete.cancel.confirm", {
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
      title: tAttendance("leaveCases.actions.batchDelete.cancel.label"),
    });
  }, [apiRef, clearRowSelection, setDialog, tAttendance]);

  const availableActions = useMemo(() => {
    const rowActions = rows.map(getRowActions);

    return {
      assignChild: rowActions.some(({ assignChild }) => assignChild),
      delete: rowActions.some((actions) => actions.delete),
      update: rowActions.some(({ update }) => update),
    };
  }, [getRowActions, rows]);

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
      ...((availableActions.assignChild ||
        availableActions.update ||
        availableActions.delete ||
        canViewAuditLog) &&
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
              }: GridRenderCellParams<AttendanceLeaveCase>) => {
                const rowActions = getRowActions(row);

                return (
                  <StyledStack direction="row">
                    {availableActions.assignChild && (
                      <Tooltip title={tAttendance("assignParentalChild")}>
                        <StyledIconButton
                          onClick={() => {
                            if (rowActions.assignChild) handleAssignChild(row);
                          }}
                          size="small"
                          visible={rowActions.assignChild}
                        >
                          <ChildCare fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                    {availableActions.update && (
                      <Tooltip title={tAttendance("leaveCases.actions.update")}>
                        <StyledIconButton
                          onClick={() => {
                            if (rowActions.update) handleLeaveCaseDialog(row);
                          }}
                          size="small"
                          visible={rowActions.update}
                        >
                          <Edit fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                    {canViewAuditLog && <AuditLogButton resourceId={row.id} />}
                    {availableActions.delete && (
                      <Tooltip title={tAttendance("leaveCases.actions.delete")}>
                        <StyledIconButton
                          onClick={() => {
                            if (rowActions.delete) handleDeleteLeaveCase(row);
                          }}
                          size="small"
                          visible={rowActions.delete}
                        >
                          <Delete fontSize="small" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                  </StyledStack>
                );
              },
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      ...(canViewAll
        ? [
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
          ]
        : []),
      {
        field: "leaveTypeName",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("leaveType.label"),
        renderCell: ({
          row: { leaveTypeName, leaveTypeStatutoryKind },
        }: GridRenderCellParams<AttendanceLeaveCase>) =>
          getStatutoryLeaveName(tAttendance, {
            name: leaveTypeName,
            statutoryKind: leaveTypeStatutoryKind,
          }),
        type: "singleSelect",
        valueOptions: leaveTypeOptions,
      },
      {
        field: "reference",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("caseReference.label"),
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
        field: "grantedMinutes",
        filterable: false,
        headerName: tAttendance("grantedMinutes"),
        type: "number",
        valueFormatter: (value: number, row: AttendanceLeaveCase) =>
          formatLeaveDuration(tAttendance, value, row.calendarLeave),
      },
      {
        field: "usedMinutes",
        filterable: false,
        headerName: tAttendance("usedMinutes"),
        sortable: false,
        type: "number",
        valueFormatter: (value: number, row: AttendanceLeaveCase) =>
          formatLeaveDuration(tAttendance, value, row.calendarLeave),
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
        headerName: tAttendance("reason.label"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
    ],
    [
      availableActions,
      canViewAll,
      canViewAuditLog,
      date,
      dateFilterOperators,
      enumFilterOperators,
      getRowActions,
      handleAssignChild,
      handleDeleteLeaveCase,
      handleLeaveCaseDialog,
      isParentalLeave,
      isSelectMode,
      leaveTypeOptions,
      numberFilterOperators,
      parentalChildren,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {(canWrite || canDelete) && (
        <ToolbarStack direction="row">
          {!isSelectMode && (
            <>
              {canWrite && (
                <Button
                  onClick={() => handleLeaveCaseDialog()}
                  size="small"
                  startIcon={<Add />}
                  variant="contained"
                >
                  {tAttendance("leaveCases.actions.create")}
                </Button>
              )}
              {canDelete && (
                <Button
                  disabled={!hasSelectableRows}
                  onClick={handleEnterLeaveCaseBatchDeleteMode}
                  size="small"
                  startIcon={<Delete />}
                  variant="outlined"
                >
                  {tAttendance("leaveCases.actions.batchDelete.title")}
                </Button>
              )}
            </>
          )}
          {isSelectMode && (
            <>
              <Button
                onClick={handleCancelLeaveCaseBatchDelete}
                size="small"
                startIcon={<Cancel />}
                variant="outlined"
              >
                {tAttendance("leaveCases.actions.batchDelete.cancel.label")}
              </Button>
              <Button
                color="error"
                disabled={!selectedRows.length}
                onClick={handleSubmitLeaveCaseBatchDelete}
                size="small"
                startIcon={<Delete />}
                variant="contained"
              >
                {tAttendance("leaveCases.actions.batchDelete.submit.label", {
                  count: selectedRows.length,
                })}
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

export default LeaveCases;
