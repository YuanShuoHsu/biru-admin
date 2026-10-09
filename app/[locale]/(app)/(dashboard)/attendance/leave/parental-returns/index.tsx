"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo, useState } from "react";
import useSWR, { mutate as mutateCache } from "swr";

import ReturnReviewDialog from "./ReturnReviewDialog";

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
import { attendanceReviewCountsKey } from "@/hooks/useAttendanceReviewCounts";

import { Check, Close, Undo } from "@mui/icons-material";
import { Chip, IconButton, Stack, Tooltip } from "@mui/material";
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
  AttendanceParentalReturn,
  AttendanceParentalReturnFilterField,
  AttendanceParentalReturnPage,
  AttendanceParentalReturnSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getAttendanceParentalReturnEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const StyledStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
  height: "100%",
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface ParentalReturnsProps {
  canReview: boolean;
  canViewAll: boolean;
  canReviewOwn: boolean;
  employeeId?: string;
  filterField?: AttendanceParentalReturnFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceParentalReturn[];
  sortBy?: AttendanceParentalReturnSortField;
  sortDirection?: SortDirection;
}

const ParentalReturns = ({
  canReview,
  canViewAll,
  canReviewOwn,
  employeeId,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organization: { slug: organizationSlug },
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: ParentalReturnsProps) => {
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
    () => getAttendanceParentalReturnEnumOptions(tAttendance),
    [tAttendance],
  );

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "dateTime"),
    [format],
  );

  const base = attendancePath(
    organizationSlug,
    canViewAll ? "org" : "me",
    "return-requests",
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
      fetcher<AttendanceParentalReturnPage>(
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

  const handleReview = useCallback(
    (
      parentalReturn: AttendanceParentalReturn,
      status: "approved" | "rejected",
    ) =>
      setDialog({
        confirmText: tAttendance(status === "approved" ? "approve" : "reject"),
        content: (
          <ReturnReviewDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            parentalReturn={parentalReturn}
            status={status}
          />
        ),
        formId: "attendance-return-review-form",
        open: true,
        title: tAttendance(status === "approved" ? "approve" : "reject"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleWithdraw = useCallback(
    ({ employeeName, id }: AttendanceParentalReturn) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(`${base}/${id}/withdraw`, { method: "PATCH" });

            enqueueSnackbar(
              tAttendance("parentalReturns.withdrawn", { name: employeeName }),
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
        title: tAttendance("withdraw"),
      }),
    [base, mutate, setDialog, tAttendance],
  );

  const getRowActions = useCallback(
    (row: AttendanceParentalReturn) => ({
      review:
        row.status === "pending" &&
        canReview &&
        (canReviewOwn || row.employeeId !== employeeId),
      withdraw: row.status === "pending" && row.employeeId === employeeId,
    }),
    [canReview, canReviewOwn, employeeId],
  );

  const availableActions = useMemo(() => {
    const rowActions = rows.map(getRowActions);

    return {
      review: rowActions.some(({ review }) => review),
      withdraw: rowActions.some(({ withdraw }) => withdraw),
    };
  }, [getRowActions, rows]);

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({
          row,
        }: GridRenderCellParams<AttendanceParentalReturn>) =>
          row.status === "pending" ? (
            <StyledStack direction="row">
              {availableActions.review && (
                <>
                  <Tooltip title={tAttendance("approve")}>
                    <StyledIconButton
                      color="success"
                      onClick={() => {
                        if (getRowActions(row).review)
                          handleReview(row, "approved");
                      }}
                      size="small"
                      visible={getRowActions(row).review}
                    >
                      <Check fontSize="small" />
                    </StyledIconButton>
                  </Tooltip>
                  <Tooltip title={tAttendance("reject")}>
                    <StyledIconButton
                      color="error"
                      onClick={() => {
                        if (getRowActions(row).review)
                          handleReview(row, "rejected");
                      }}
                      size="small"
                      visible={getRowActions(row).review}
                    >
                      <Close fontSize="small" />
                    </StyledIconButton>
                  </Tooltip>
                </>
              )}
              {availableActions.withdraw && (
                <Tooltip title={tAttendance("withdraw")}>
                  <StyledIconButton
                    onClick={() => {
                      if (getRowActions(row).withdraw) handleWithdraw(row);
                    }}
                    size="small"
                    visible={getRowActions(row).withdraw}
                  >
                    <Undo fontSize="small" />
                  </StyledIconButton>
                </Tooltip>
              )}
            </StyledStack>
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
        field: "employeeEmail",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("account"),
      },
      {
        field: "returnsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("returnsAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "date"),
      },
      {
        field: "originalStartsAt",
        filterOperators: dateFilterOperators,
        headerName: tAttendance("originalLeavePeriod"),
        valueGetter: (value: string, row: AttendanceParentalReturn) =>
          `${date(value)} – ${date(row.originalEndsAt)}`,
      },
      {
        field: "reason",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("reason.label"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("status.label"),
        renderCell: ({
          row,
        }: GridRenderCellParams<AttendanceParentalReturn>) => (
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
        field: "reviewReason",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("reviewReason"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
    ],
    [
      availableActions,
      date,
      dateFilterOperators,
      enumFilterOperators,
      enumOptions.status,
      format,
      getRowActions,
      handleReview,
      handleWithdraw,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
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
            exportDateField: "returnsAt",
          },
        }}
      />
    </>
  );
};

export default ParentalReturns;
