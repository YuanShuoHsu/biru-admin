"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";
import useSWR from "swr";

import StockCell from "../../../StockCell";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useDataGridQueryState } from "@/hooks/useDataGridQueryState";
import {
  useDateFilterOperators,
  useEnumFilterOperators,
  useNumberFilterOperators,
  useStringFilterOperators,
} from "@/hooks/useFilterOperators";
import { useFormatMoney } from "@/hooks/useFormatMoney";

import { Chip } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Ingredient,
  InventoryTransaction,
  InventoryTransactionFilterField,
  InventoryTransactionListResponse,
  InventoryTransactionSortField,
} from "@/types/inventory";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { getInventoryTransactionEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { formatStockDelta, formatUnitPriceOf } from "@/utils/ingredients";

interface IngredientTransactionsProps {
  canViewPurchasing?: boolean;
  filterField?: InventoryTransactionFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredient?: Ingredient;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount?: number;
  rows?: InventoryTransaction[];
  sortBy?: InventoryTransactionSortField;
  sortDirection?: SortDirection;
}

const IngredientTransactions = ({
  canViewPurchasing = false,
  filterField,
  filterOperator,
  filterValue,
  ingredient,
  loading = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  quickFilterValue,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
}: IngredientTransactionsProps) => {
  const ingredientId = ingredient?.id ?? "";

  const {
    filterModel,
    handleFilterModelChange,
    handlePaginationModelChange,
    handleSortModelChange,
    paginationModel,
    sortModel,
  } = useDataGridQueryState({
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    sortBy,
    sortDirection,
  });

  const dateFilterOperators = useDateFilterOperators();
  const enumFilterOperators = useEnumFilterOperators();
  const numberFilterOperators = useNumberFilterOperators();
  const stringFilterOperators = useStringFilterOperators();

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const enumOptions = useMemo(
    () => getInventoryTransactionEnumOptions(tInventory),
    [tInventory],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    !loading && [
      `/api/ingredients/${ingredientId}/inventory-transactions`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<InventoryTransactionListResponse>(
        `/api/ingredients/${ingredientId}/inventory-transactions?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
      ),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      keepPreviousData: true,
      onSuccess: () => {
        setTimeout(() => {
          apiRef.current?.autosizeColumns(autosizeOptions);
        }, 0);
      },
    },
  );

  const columns = useMemo<GridColDef[]>(() => {
    const costColumns: GridColDef[] = [
      {
        field: "unitCost",
        filterOperators: numberFilterOperators,
        headerName: tInventory("transactions.unitCost.label"),
        renderCell: renderEmptyableCell,
        type: "number",
        valueFormatter: (value: InventoryTransaction["unitCost"]) =>
          value == null || !ingredient
            ? ""
            : formatUnitPriceOf(Number(value), ingredient, {
                format,
                formatMoney,
                tCommon,
                tInventory,
              }),
      },
    ];

    return [
      {
        field: "reason",
        filterOperators: enumFilterOperators,
        headerName: tInventory("transactions.reason.label"),
        type: "singleSelect",
        valueOptions: enumOptions.reason,
      },
      {
        field: "wasteReason",
        filterable: false,
        headerName: tInventory("transactions.wasteReason.label"),
        renderCell: renderEmptyableCell,
        sortable: false,
        type: "singleSelect",
        valueOptions: enumOptions.wasteReason,
      },
      {
        field: "quantity",
        filterOperators: numberFilterOperators,
        headerName: tInventory("transactions.quantity.label"),
        renderCell: ({
          row: { quantity },
        }: GridRenderCellParams<InventoryTransaction>) =>
          ingredient && (
            <Chip
              color={Number(quantity) < 0 ? "error" : "success"}
              label={formatStockDelta(Number(quantity), ingredient, {
                format,
                tCommon,
                tInventory,
              })}
              size="small"
              variant="outlined"
            />
          ),
        type: "number",
      },
      {
        field: "balance",
        filterable: false,
        headerName: tInventory("transactions.balance.label"),
        renderCell: ({
          row: { balance },
        }: GridRenderCellParams<InventoryTransaction>) =>
          ingredient && (
            <StockCell ingredient={ingredient} quantity={Number(balance)} />
          ),
        sortable: false,
        type: "number",
      },
      ...(canViewPurchasing ? costColumns : []),
      {
        field: "orderNumber",
        filterable: false,
        headerName: tInventory("transactions.orderNumber.label"),
        renderCell: renderEmptyableCell,
        sortable: false,
      },
      {
        field: "note",
        filterOperators: stringFilterOperators,
        headerName: tInventory("transactions.note.label"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
      {
        field: "createdAt",
        filterOperators: dateFilterOperators,
        headerName: tInventory("createdAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "short"),
      },
    ];
  }, [
    canViewPurchasing,
    dateFilterOperators,
    enumFilterOperators,
    enumOptions,
    format,
    formatMoney,
    ingredient,
    numberFilterOperators,
    stringFilterOperators,
    tCommon,
    tInventory,
  ]);

  return (
    <DataGrid
      {...DATA_GRID_PROPS}
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
      slotProps={{
        ...DATA_GRID_PROPS.slotProps,
        toolbar: {
          exportDateField: "createdAt",
        },
      }}
    />
  );
};

export default IngredientTransactions;
