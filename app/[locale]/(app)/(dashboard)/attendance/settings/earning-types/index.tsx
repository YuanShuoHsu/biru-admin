"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import EarningTypeDialog from "./EarningTypeDialog";

import {
  autosizeOptions,
  DATA_GRID_PROPS,
  NO_VALUE_FILTER_OPERATORS,
} from "@/constants/dataGrid";
import { getPageSizeOptions } from "@/constants/pagination";

import {
  useEnumFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
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
  PayrollEarningType,
  PayrollEarningTypeFilterField,
  PayrollEarningTypePage,
  PayrollEarningTypeSortField,
} from "@/types/attendance";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";

import { attendanceErrorKey, payrollPath } from "@/utils/attendance";
import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getPayrollEarningTypeEnumOptions } from "@/utils/enumOptions";
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

interface EarningTypesProps {
  filterField?: PayrollEarningTypeFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: PayrollEarningType[];
  sortBy?: PayrollEarningTypeSortField;
  sortDirection?: SortDirection;
}

const EarningTypes = ({
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
}: EarningTypesProps) => {
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

  const enumFilterOperators = useEnumFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const apiRef = useGridApiRef();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getPayrollEarningTypeEnumOptions(tAttendance),
    [tAttendance],
  );

  const base = payrollPath(organizationSlug, "org", "earning-types");

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
      fetcher<PayrollEarningTypePage>(
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

  const handleEarningTypeDialog = useCallback(
    (earningType?: PayrollEarningType) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <EarningTypeDialog
            earningType={earningType}
            mutate={mutate}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "payroll-earning-type-form",
        open: true,
        title: tAttendance(
          earningType
            ? "earningTypes.actions.update.title"
            : "earningTypes.actions.create.title",
        ),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleDeleteEarningType = useCallback(
    ({ id, name }: PayrollEarningType) =>
      setDialog({
        content: (
          <DialogContentText>
            {tAttendance.rich("earningTypes.actions.delete.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              payrollPath(organizationSlug, "org", `earning-types/${id}`),
              { method: "DELETE" },
            );

            enqueueSnackbar(
              tAttendance("earningTypes.actions.delete.success", { name }),
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
        title: tAttendance("earningTypes.actions.delete.title"),
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
        renderCell: ({ row }: GridRenderCellParams<PayrollEarningType>) => (
          <ActionsStack direction="row">
            <Tooltip title={tAttendance("earningTypes.actions.update.title")}>
              <IconButton
                onClick={() => handleEarningTypeDialog(row)}
                size="small"
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            {!row.inUse && (
              <Tooltip title={tAttendance("earningTypes.actions.delete.title")}>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteEarningType(row)}
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
      {
        field: "name",
        filterOperators: stringFilterOperators,
        headerName: tAttendance("name"),
      },
      {
        field: "category",
        filterOperators: enumFilterOperators,
        headerName: tAttendance("earningCategory.label"),
        type: "singleSelect",
        valueOptions: enumOptions.category,
      },
    ],
    [
      enumFilterOperators,
      enumOptions.category,
      handleDeleteEarningType,
      handleEarningTypeDialog,
      stringFilterOperators,
      tAttendance,
    ],
  );

  return (
    <>
      <StyledButton
        onClick={() => handleEarningTypeDialog()}
        startIcon={<Add />}
        variant="contained"
      >
        {tAttendance("earningTypes.actions.create.title")}
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

export default EarningTypes;
