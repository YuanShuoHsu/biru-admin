"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import ReviewDialog from "./ReviewDialog";

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

import { Check, Close } from "@mui/icons-material";
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
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
  AttendanceRequest,
  AttendanceRequestFilterField,
  AttendanceRequestPage,
  AttendanceRequestSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceRequestEnumOptions } from "@/utils/enumOptions";
import { attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface ReviewsProps {
  employeeId?: string;
  filterField?: AttendanceRequestFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  leaveTypes: AttendanceLeaveType[];
  organizationSlug: string;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceRequest[];
  sortBy?: AttendanceRequestSortField;
  sortDirection?: SortDirection;
}

const Reviews = ({
  employeeId,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  leaveTypes,
  organizationSlug,
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
    (value: string) => format.dateTime(new Date(value), "short"),
    [format],
  );

  const base = attendancePath(organizationSlug, "all", "requests");

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

  const handleReview = useCallback(
    (request: AttendanceRequest, status: "approved" | "rejected") =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <ReviewDialog
            leaveTypes={leaveTypes}
            mutate={mutate}
            organizationSlug={organizationSlug}
            request={request}
            status={status}
          />
        ),
        formId: "attendance-review-form",
        open: true,
        title: reviewTitle(request, status),
      }),
    [leaveTypes, mutate, organizationSlug, reviewTitle, setDialog, tAttendance],
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
          row.status === "pending" || row.status === "cancellationPending" ? (
            <Stack alignItems="center" direction="row" gap={1} height="100%">
              <Tooltip
                title={
                  row.employeeId === employeeId
                    ? tAttendance("errors.cannotReviewSelf")
                    : reviewTitle(row, "approved")
                }
              >
                <span>
                  <IconButton
                    color="success"
                    disabled={row.employeeId === employeeId}
                    onClick={() => handleReview(row, "approved")}
                    size="small"
                  >
                    <Check fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  row.employeeId === employeeId
                    ? tAttendance("errors.cannotReviewSelf")
                    : reviewTitle(row, "rejected")
                }
              >
                <span>
                  <IconButton
                    color="error"
                    disabled={row.employeeId === employeeId}
                    onClick={() => handleReview(row, "rejected")}
                    size="small"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ) : null,
        resizable: false,
        sortable: false,
      },
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
      employeeId,
      enumFilterOperators,
      enumOptions.kind,
      enumOptions.status,
      handleReview,
      reviewTitle,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
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
  );
};

export default Reviews;
