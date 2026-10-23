"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import AdjustPointsDialog from "../AdjustPointsDialog";

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
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add } from "@mui/icons-material";
import { Button, Chip, Stack } from "@mui/material";
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

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  OrganizationPointTransaction,
  PointTransactionFilterField,
  PointTransactionSortField,
} from "@/types/points";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getPointTransactionEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface PointTransactionsProps {
  filterField?: PointTransactionFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug: string;
  page: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: OrganizationPointTransaction[];
  sortBy?: PointTransactionSortField;
  sortDirection?: SortDirection;
}

const PointTransactions = ({
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  organizationSlug,
  page,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: PointTransactionsProps) => {
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

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const apiRef = useGridApiRef();

  const { setDialog } = useDialogStore((state) => state);

  const tAuth = useTranslations("auth");
  const tOrganizations = useTranslations("organizations");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getPointTransactionEnumOptions(tAuth),
    [tAuth],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
    mutate,
  } = useSWR(
    [
      `/api/organizations/${organizationSlug}/point-transactions`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: OrganizationPointTransaction[]; total: number }>(
        `/api/organizations/${organizationSlug}/point-transactions?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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

  const handleAdjustPoints = () => {
    setDialog({
      content: (
        <AdjustPointsDialog
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ),
      formId: "adjust-points-form",
      open: true,
      title: tOrganizations("points.adjust.title"),
    });
  };

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tOrganizations("points.transactions.createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
      {
        field: "userName",
        filterOperators: stringFilterOperators,
        headerName: tOrganizations("points.transactions.userName"),
      },
      {
        field: "userEmail",
        filterOperators: stringFilterOperators,
        headerName: tOrganizations("points.transactions.userEmail"),
      },
      {
        field: "type",
        filterOperators: enumFilterOperators,
        headerName: tOrganizations("points.transactions.type"),
        type: "singleSelect",
        valueOptions: enumOptions.type,
      },
      {
        field: "points",
        filterOperators: numberFilterOperators,
        headerName: tOrganizations("points.transactions.points"),
        renderCell: ({
          row: { points },
        }: GridRenderCellParams<OrganizationPointTransaction>) => (
          <Chip
            color={points < 0 ? "error" : "success"}
            label={tAuth("points.points", {
              points: format.number(points, { signDisplay: "exceptZero" }),
            })}
            size="small"
            variant="outlined"
          />
        ),
        type: "number",
      },
      {
        field: "remainingPoints",
        filterOperators: numberFilterOperators,
        headerName: tOrganizations("points.transactions.remainingPoints"),
        type: "number",
      },
      {
        field: "orderNumber",
        filterOperators: stringFilterOperators,
        headerName: tOrganizations("points.transactions.orderNumber"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "note",
        filterable: false,
        headerName: tOrganizations("points.transactions.note"),
        renderCell: renderEmptyableCell,
        sortable: false,
      },
      {
        field: "expiresAt",
        filterOperators: dateFilterOperators,
        headerName: tOrganizations("points.transactions.expiresAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: (value: string | null) =>
          value ? format.dateTime(new Date(value), "short") : "",
      },
    ],
    [
      dateFilterOperators,
      enumFilterOperators,
      enumOptions,
      format,
      numberFilterOperators,
      stringFilterOperators,
      tAuth,
      tOrganizations,
    ],
  );

  return (
    <>
      <ToolbarStack direction="row">
        <Button
          onClick={handleAdjustPoints}
          size="small"
          startIcon={<Add />}
          variant="contained"
        >
          {tOrganizations("points.adjust.title")}
        </Button>
      </ToolbarStack>
      <DataGrid
        {...DATA_GRID_PROPS}
        apiRef={apiRef}
        columns={columns}
        filterMode="server"
        filterModel={filterModel}
        loading={isValidating}
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
            exportDateField: "createdAt",
          },
        }}
      />
    </>
  );
};

export default PointTransactions;
