"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import LeaveDialog from "./LeaveDialog";
import ReturnDialog from "./ReturnDialog";

import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

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
  DialogContentText,
  IconButton,
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

import type {
  AttendanceLeaveCase,
  AttendanceLeaveType,
  AttendanceRequest,
  AttendanceRequestFilterField,
  AttendanceRequestPage,
  AttendanceRequestSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  attendanceErrorKey,
  attendancePath,
  getStatutoryLeaveName,
} from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceRequestEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

const StyledStack = styled(Stack)(({ theme }) => ({
  height: "100%",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

interface RequestsProps {
  enabled: boolean;
  filterField?: AttendanceRequestFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveCases: AttendanceLeaveCase[];
  leaveTypes: AttendanceLeaveType[];
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceRequest[];
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
  organization: { slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
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

  const handleCreateLeave = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <LeaveDialog
            leaveCases={leaveCases}
            leaveTypes={leaveTypes}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-leave-form",
        open: true,
        title: tAttendance("requests.actions.create"),
      }),
    [leaveCases, leaveTypes, mutate, organizationSlug, setDialog, tAttendance],
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
    ({
      endsAt,
      id,
      kind,
      leaveTypeName,
      leaveTypeStatutoryKind,
      startsAt,
      status,
    }: AttendanceRequest) => {
      const action = status === "approved" ? "cancelLeave" : "withdraw";

      const values = {
        name:
          leaveTypeName && leaveTypeStatutoryKind
            ? getStatutoryLeaveName(tAttendance, {
                name: leaveTypeName,
                statutoryKind: leaveTypeStatutoryKind,
              })
            : tAttendance(`kind.options.${kind}`),
        period: format.dateTimeRange(
          new Date(startsAt),
          new Date(endsAt),
          "dateTime",
        ),
      };

      setDialog({
        content: (
          <DialogContentText>
            {tAttendance.rich(`requests.actions.${action}.confirm`, {
              ...values,
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </DialogContentText>
        ),
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

            enqueueSnackbar(
              tAttendance(`requests.actions.${action}.success`, values),
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
        title: tAttendance(action),
      });
    },
    [format, mutate, organizationSlug, setDialog, tAttendance],
  );

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "short"),
    [format],
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
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({ row }: GridRenderCellParams<AttendanceRequest>) =>
          row.status === "pending" ||
          (row.kind === "leave" && row.status === "approved") ? (
            <StyledStack direction="row">
              <Tooltip
                title={tAttendance(
                  row.returnPending
                    ? "errors.parentalReturnPending"
                    : "parentalReturn",
                )}
              >
                <span>
                  <StyledIconButton
                    disabled={row.returnPending}
                    onClick={() => handleReturn(row)}
                    size="small"
                    visible={
                      row.status === "approved" &&
                      !!row.parentalMode &&
                      dayjs(row.endsAt).isAfter(dayjs())
                    }
                  >
                    <AssignmentReturn fontSize="small" />
                  </StyledIconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={tAttendance(
                  row.returnPending
                    ? "errors.parentalReturnPending"
                    : row.status === "approved"
                      ? "cancelLeave"
                      : "withdraw",
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
            </StyledStack>
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
        filterOperators: enumFilterOperators,
        headerName: tAttendance("leaveType.label"),
        renderCell: ({
          row: { leaveTypeName, leaveTypeStatutoryKind },
        }: GridRenderCellParams<AttendanceRequest>) =>
          leaveTypeName && leaveTypeStatutoryKind ? (
            getStatutoryLeaveName(tAttendance, {
              name: leaveTypeName,
              statutoryKind: leaveTypeStatutoryKind,
            })
          ) : (
            <EmptyCell />
          ),
        type: "singleSelect",
        valueOptions: leaveTypeOptions,
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
        headerName: tAttendance("reason.label"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
      {
        field: "reviewReason",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("reviewReason"),
        maxWidth: 320,
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
      leaveTypeOptions,
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
      <StyledButton
        disabled={!enabled}
        onClick={handleCreateLeave}
        size="small"
        startIcon={<Add />}
        variant="contained"
      >
        {tAttendance("requests.actions.create")}
      </StyledButton>
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

export default Requests;
