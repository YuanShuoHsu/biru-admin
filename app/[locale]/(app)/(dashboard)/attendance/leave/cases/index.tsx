"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
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
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, ChildCare, Delete, Edit } from "@mui/icons-material";
import { Alert, Button, IconButton, Stack, Tooltip } from "@mui/material";
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
  AttendanceLeaveCase,
  AttendanceLeaveCaseFilterField,
  AttendanceLeaveCasePage,
  AttendanceLeaveCaseSortField,
  AttendanceLeaveType,
  AttendanceParentalChild,
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

const StyledStack = styled(Stack)({
  alignItems: "center",
  height: "100%",
});

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface LeaveCasesProps {
  canAssignChild: boolean;
  canDelete: boolean;
  canUpdate: boolean;
  canViewAll: boolean;
  canWrite: boolean;
  employeeId?: string;
  employees: AttendanceEmployee[];
  filterField?: AttendanceLeaveCaseFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveTypes: AttendanceLeaveType[];
  organization: Organization;
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
  canDelete,
  canUpdate,
  canViewAll,
  canWrite,
  employeeId,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes,
  organization: { slug: organizationSlug },
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

  const handleLeaveCaseDialog = useCallback(
    (leaveCase?: AttendanceLeaveCase) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <LeaveCaseDialog
            employeeId={employeeId}
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
        contentText: tAttendance("confirm"),
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
            enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
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
      ...(canAssignChild || canUpdate || canDelete
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
                const own = row.employeeId === employeeId;

                return (
                  <StyledStack direction="row">
                    {canAssignChild &&
                      isParentalLeave(row.leaveTypeId) &&
                      !own &&
                      !row.childId && (
                        <Tooltip title={tAttendance("assignParentalChild")}>
                          <IconButton
                            onClick={() => handleAssignChild(row)}
                            size="small"
                          >
                            <ChildCare fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    {canUpdate && !own && (
                      <Tooltip title={tAttendance("leaveCases.actions.update")}>
                        <IconButton
                          onClick={() => handleLeaveCaseDialog(row)}
                          size="small"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && !own && !row.usedMinutes && (
                      <Tooltip title={tAttendance("leaveCases.actions.delete")}>
                        <IconButton
                          onClick={() => handleDeleteLeaveCase(row)}
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
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
      {
        field: "employeeName",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("employee"),
      },
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
      canAssignChild,
      canDelete,
      canUpdate,
      date,
      dateFilterOperators,
      employeeId,
      enumFilterOperators,
      handleAssignChild,
      handleDeleteLeaveCase,
      handleLeaveCaseDialog,
      isParentalLeave,
      leaveTypeOptions,
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
        <StyledButton
          onClick={() => handleLeaveCaseDialog()}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tAttendance("leaveCases.actions.create")}
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

export default LeaveCases;
