"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as mutateCache } from "swr";

import BatchReviewDialog from "../../BatchReviewDialog";
import LeaveCaseDialog from "../../leave/cases/LeaveCaseDialog";
import ReviewDialog from "./ReviewDialog";

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
import { attendanceReviewCountsKey } from "@/hooks/useAttendanceReviewCounts";

import { Check, Close } from "@mui/icons-material";
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
  AttendanceLeaveType,
  AttendanceRequest,
  AttendanceRequestFilterField,
  AttendanceRequestPage,
  AttendanceRequestSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import {
  getDataGridSearchParams,
  getFilterItemParams,
  getSelectedRows,
} from "@/utils/dataGrid";
import { getAttendanceRequestEnumOptions } from "@/utils/enumOptions";
import { attendancePath, getStatutoryLeaveName } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
  height: "100%",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface ReviewsProps {
  canGrantLeaveCase: boolean;
  canReview: boolean;
  canReviewOwn: boolean;
  employeeId?: string;
  employees: AttendanceEmployee[];
  filterField?: AttendanceRequestFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
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

const Reviews = ({
  canGrantLeaveCase,
  canReview,
  canReviewOwn,
  employeeId,
  employees,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes,
  organization: { slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: ReviewsProps) => {
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

  const [rowSelectionModel, setRowSelectionModel] =
    useState<GridRowSelectionModel>({ ids: new Set(), type: "include" });

  const { setDialog } = useDialogStore((state) => state);

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getAttendanceRequestEnumOptions(tAttendance),
    [tAttendance],
  );

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "dateTime"),
    [format],
  );

  const base = attendancePath(organizationSlug, "org", "requests");

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
      fetcher<AttendanceRequestPage>(
        `${base}?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
      ),
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

  const reviewTitle = useCallback(
    (request: AttendanceRequest, status: "approved" | "rejected") =>
      tAttendance(
        request.status === "cancellationPending"
          ? status === "approved"
            ? "approveCancellation"
            : "rejectCancellation"
          : status === "approved"
            ? "approve"
            : "reject",
      ),
    [tAttendance],
  );

  const requestName = useCallback(
    ({ kind, leaveTypeName, leaveTypeStatutoryKind }: AttendanceRequest) =>
      leaveTypeName && leaveTypeStatutoryKind
        ? getStatutoryLeaveName(tAttendance, {
            name: leaveTypeName,
            statutoryKind: leaveTypeStatutoryKind,
          })
        : tAttendance(`kind.options.${kind}`),
    [tAttendance],
  );

  const handleReview = useCallback(
    (request: AttendanceRequest, status: "approved" | "rejected") => {
      const grantsLeaveCase =
        canGrantLeaveCase &&
        status === "approved" &&
        request.status === "pending" &&
        !request.leaveCaseId &&
        !!leaveTypes.find(({ id }) => id === request.leaveTypeId)?.eventLeave;

      setDialog({
        confirmText: tAttendance(status === "approved" ? "approve" : "reject"),
        content: grantsLeaveCase ? (
          <LeaveCaseDialog
            employees={employees}
            leaveTypes={leaveTypes}
            mutate={mutate}
            organizationSlug={organizationSlug}
            parentalChildren={[]}
            request={request}
          />
        ) : (
          <ReviewDialog
            leaveTypes={leaveTypes}
            mutate={mutate}
            organizationSlug={organizationSlug}
            request={request}
            status={status}
          />
        ),
        formId: grantsLeaveCase
          ? "attendance-leave-case-form"
          : "attendance-review-form",
        open: true,
        title: reviewTitle(request, status),
      });
    },
    [
      canGrantLeaveCase,
      employees,
      leaveTypes,
      mutate,
      organizationSlug,
      reviewTitle,
      setDialog,
      tAttendance,
    ],
  );

  const isReviewable = useCallback(
    ({
      employeeId: requestEmployeeId,
      status,
    }: Pick<AttendanceRequest, "employeeId" | "status">) =>
      (status === "pending" || status === "cancellationPending") &&
      (canReviewOwn || requestEmployeeId !== employeeId),
    [canReviewOwn, employeeId],
  );

  const selectedRows = useMemo(
    () => getSelectedRows(rows, rowSelectionModel).filter(isReviewable),
    [isReviewable, rowSelectionModel, rows],
  );

  const handleBatchReview = useCallback(
    (status: "approved" | "rejected") =>
      setDialog({
        confirmText: tAttendance(status === "approved" ? "approve" : "reject"),
        content: (
          <BatchReviewDialog
            labels={Object.fromEntries(
              selectedRows.map((request) => [
                request.id,
                `${request.employeeName} · ${requestName(request)} · ${date(request.startsAt)}`,
              ]),
            )}
            method="PATCH"
            mutate={() => {
              setRowSelectionModel({ ids: new Set(), type: "include" });

              mutate();
            }}
            path={`${base}/review`}
            status={status}
          />
        ),
        formId: "attendance-batch-review-form",
        open: true,
        title: tAttendance(
          status === "approved" ? "approveSelected" : "rejectSelected",
          { count: selectedRows.length },
        ),
      }),
    [base, date, mutate, requestName, selectedRows, setDialog, tAttendance],
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
      ...(canReview
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({ row }: GridRenderCellParams<AttendanceRequest>) =>
                row.status === "pending" ||
                row.status === "cancellationPending" ? (
                  <StyledStack direction="row">
                    <Tooltip
                      title={
                        !canReviewOwn && row.employeeId === employeeId
                          ? tAttendance("errors.cannotReviewSelf")
                          : reviewTitle(row, "approved")
                      }
                    >
                      <span>
                        <IconButton
                          color="success"
                          disabled={
                            !canReviewOwn && row.employeeId === employeeId
                          }
                          onClick={() => handleReview(row, "approved")}
                          size="small"
                        >
                          <Check fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        !canReviewOwn && row.employeeId === employeeId
                          ? tAttendance("errors.cannotReviewSelf")
                          : reviewTitle(row, "rejected")
                      }
                    >
                      <span>
                        <IconButton
                          color="error"
                          disabled={
                            !canReviewOwn && row.employeeId === employeeId
                          }
                          onClick={() => handleReview(row, "rejected")}
                          size="small"
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </StyledStack>
                ) : null,
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
        type: "singleSelect",
        valueOptions: enumOptions.status,
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
      canReviewOwn,
      canReview,
      date,
      dateFilterOperators,
      employeeId,
      enumFilterOperators,
      enumOptions.kind,
      enumOptions.status,
      handleReview,
      leaveTypeOptions,
      reviewTitle,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      {canReview && (
        <ToolbarStack direction="row">
          <Button
            color="error"
            disabled={!selectedRows.length}
            onClick={() => handleBatchReview("rejected")}
            size="small"
          >
            {tAttendance("rejectSelected", { count: selectedRows.length })}
          </Button>
          <Button
            disabled={!selectedRows.length}
            onClick={() => handleBatchReview("approved")}
            size="small"
            variant="contained"
          >
            {tAttendance("approveSelected", { count: selectedRows.length })}
          </Button>
        </ToolbarStack>
      )}
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        checkboxSelection={canReview}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        isRowSelectable={({ row: { employeeId, status } }) =>
          isReviewable({ employeeId, status })
        }
        loading={loading}
        onFilterModelChange={handleFilterModelChange}
        onPaginationModelChange={handlePaginationModelChange}
        onRowSelectionModelChange={setRowSelectionModel}
        onSortModelChange={handleSortModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
        rowSelectionModel={rowSelectionModel}
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

export default Reviews;
