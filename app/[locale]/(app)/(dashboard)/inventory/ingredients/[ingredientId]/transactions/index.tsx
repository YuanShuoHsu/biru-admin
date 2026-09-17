"use client";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import StockCell from "../../StockCell";

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
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Chip } from "@mui/material";
import type {
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";
import { useGridApiRef } from "@mui/x-data-grid";

import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type {
  Ingredient,
  InventoryTransaction,
  InventoryTransactionFilterField,
  InventoryTransactionSortField,
} from "@/types/inventory";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getInventoryTransactionEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { formatStockDelta, formatUnitPriceOf } from "@/utils/ingredients";

const DataGrid = dynamic(
  () => import("@mui/x-data-grid").then(({ DataGrid }) => DataGrid),
  { ssr: false },
);

interface IngredientTransactionsProps {
  canViewPurchasing: boolean;
  filterField?: InventoryTransactionFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  ingredient: Ingredient;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: InventoryTransaction[];
  sortBy?: InventoryTransactionSortField;
  sortDirection?: SortDirection;
}

const IngredientTransactions = ({
  canViewPurchasing,
  filterField: initialFilterField,
  filterOperator: initialFilterOperator,
  filterValue: initialFilterValue,
  ingredient,
  page,
  pageSize,
  quickFilterValue: initialQuickFilterValue,
  rowCount: initialRowCount,
  rows: initialRows,
  sortBy,
  sortDirection,
}: IngredientTransactionsProps) => {
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

  const formatMoney = useFormatMoney();

  const apiRef = useGridApiRef();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getInventoryTransactionEnumOptions(tInventory),
    [tInventory],
  );

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating: loading,
  } = useSWR(
    [
      `/api/ingredients/${ingredient.id}/inventory-transactions`,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: InventoryTransaction[]; total: number }>(
        `/api/ingredients/${ingredient.id}/inventory-transactions?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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

  const columns = useMemo<GridColDef[]>(() => {
    const costColumns: GridColDef[] = [
      {
        field: "unitCost",
        filterOperators: numberFilterOperators,
        headerName: tInventory("transactions.unitCost.label"),
        renderCell: renderEmptyableCell,
        type: "number",
        valueFormatter: (value: InventoryTransaction["unitCost"]) =>
          value == null
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
        field: "quantity",
        filterOperators: numberFilterOperators,
        headerName: tInventory("transactions.quantity.label"),
        renderCell: ({
          row: { quantity },
        }: GridRenderCellParams<InventoryTransaction>) => (
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
        }: GridRenderCellParams<InventoryTransaction>) => (
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

export default IngredientTransactions;
