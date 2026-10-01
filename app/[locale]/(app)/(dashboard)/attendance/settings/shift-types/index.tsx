"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import ShiftTypeDialog from "./ShiftTypeDialog";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import { useStringFilterOperators } from "@/hooks/useFilterOperators";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, Delete, Edit } from "@mui/icons-material";
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
  AttendanceShiftType,
  AttendanceShiftTypeFilterField,
  AttendanceShiftTypePage,
  AttendanceShiftTypeSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";

const ActionsStack = styled(Stack)({
  height: "100%",
  alignItems: "center",
});

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface ShiftTypesProps {
  filterField?: AttendanceShiftTypeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: AttendanceShiftType[];
  sortBy?: AttendanceShiftTypeSortField;
  sortDirection?: SortDirection;
}

const ShiftTypes = ({
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
}: ShiftTypesProps) => {
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

  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const tAttendance = useTranslations("attendance");
  const tCommon = useTranslations("common");

  const updateQuery = useUpdateQuery();

  const base = attendancePath(organizationSlug, "org", "shift-types");

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
      fetcher<AttendanceShiftTypePage>(
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

  const handleShiftTypeDialog = useCallback(
    (shiftType?: AttendanceShiftType) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <ShiftTypeDialog
            mutate={mutate}
            organizationSlug={organizationSlug}
            shiftType={shiftType}
          />
        ),
        formId: "attendance-shift-type-form",
        open: true,
        title: tAttendance(
          shiftType
            ? "shiftTypes.actions.update.title"
            : "shiftTypes.actions.create.title",
        ),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleDeleteShiftType = useCallback(
    ({ id, name }: AttendanceShiftType) =>
      setDialog({
        content: (
          <DialogContentText>
            {tAttendance.rich("shiftTypes.actions.delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(`${base}/${id}`, { method: "DELETE" });

            enqueueSnackbar(
              tAttendance("shiftTypes.actions.delete.success", { name }),
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
        title: tAttendance("shiftTypes.actions.delete.title"),
      }),
    [base, mutate, setDialog, tAttendance],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tAttendance("actions"),
        renderCell: ({ row }: GridRenderCellParams<AttendanceShiftType>) => (
          <ActionsStack direction="row">
            <Tooltip title={tAttendance("shiftTypes.actions.update.title")}>
              <IconButton
                onClick={() => handleShiftTypeDialog(row)}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={tAttendance("shiftTypes.actions.delete.title")}>
              <IconButton
                color="error"
                onClick={() => handleDeleteShiftType(row)}
                size="small"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </ActionsStack>
        ),
        resizable: false,
        sortable: false,
      },
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("name"),
      },
      {
        field: "startTime",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("startsAt"),
      },
      {
        field: "endTime",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("endsAt"),
        valueFormatter: (value: string, { startTime }: AttendanceShiftType) =>
          value < startTime
            ? tCommon("location.openingHours.nextDayTime", { time: value })
            : value,
      },
    ],
    [
      handleDeleteShiftType,
      handleShiftTypeDialog,
      stringFilterOperators,
      tAttendance,
      tCommon,
    ],
  );

  return (
    <>
      <StyledButton
        onClick={() => handleShiftTypeDialog()}
        startIcon={<Add />}
        variant="contained"
      >
        {tAttendance("shiftTypes.actions.create.title")}
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
      />
    </>
  );
};

export default ShiftTypes;
