"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import DataGrid from "@/components/DataGrid";
import EmptyCell, { renderEmptyableCell } from "@/components/EmptyCell";

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
import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Chip, Typography } from "@mui/material";
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
  CashDrawerSessionFilterField,
  CashDrawerSessionListItem,
  CashDrawerSessionSortField,
} from "@/types/orders";

import { getDataGridSearchParams, getFilterItemParams } from "@/utils/dataGrid";
import { getCashDrawerSessionEnumOptions } from "@/utils/enumOptions";
import { fetcher } from "@/utils/fetcher";
import { cashDrawerSessionsPath } from "@/utils/orders";

interface CashDrawerSessionsProps {
  currency?: string;
  filterField?: CashDrawerSessionFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organizationSlug: string;
  page: number;
  pageSize?: number;
  quickFilterValue?: string;
  rowCount: number;
  rows: CashDrawerSessionListItem[];
  sortBy?: CashDrawerSessionSortField;
  sortDirection?: SortDirection;
}

const CashDrawerSessions = ({
  currency,
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
}: CashDrawerSessionsProps) => {
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

  const tOrders = useTranslations("orders");

  const updateQuery = useUpdateQuery();

  const enumOptions = useMemo(
    () => getCashDrawerSessionEnumOptions(tOrders),
    [tOrders],
  );

  const sessionsPath = cashDrawerSessionsPath(organizationSlug);

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isValidating,
  } = useSWR(
    [
      sessionsPath,
      filterModel.items[0]?.field,
      filterModel.items[0]?.operator,
      filterModel.items[0]?.value,
      filterModel.quickFilterValues,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async () =>
      fetcher<{ data: CashDrawerSessionListItem[]; total: number }>(
        `${sessionsPath}?${getDataGridSearchParams(paginationModel, filterModel, sortModel, enumOptions)}`,
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
    const moneyFormatter = (value: string | null) =>
      value == null ? "" : formatMoney(Number(value), currency);
    const dateTimeFormatter = (value: string | null) =>
      value ? format.dateTime(new Date(value), "short") : "";

    const moneyColumn = (
      field: CashDrawerSessionSortField,
      headerName: string,
    ): GridColDef => ({
      field,
      filterOperators: numberFilterOperators,
      headerName,
      renderCell: renderEmptyableCell,
      type: "number",
      valueFormatter: moneyFormatter,
    });

    return [
      {
        field: "businessDate",
        filterOperators: dateFilterOperators,
        headerName: tOrders("cashDrawer.businessDate"),
      },
      {
        field: "status",
        filterOperators: enumFilterOperators,
        headerName: tOrders("cashDrawer.sessions.status.label"),
        type: "singleSelect",
        valueOptions: enumOptions.status,
      },
      {
        field: "openedAt",
        filterOperators: dateFilterOperators,
        headerName: tOrders("cashDrawer.sessions.openedAt"),
        valueFormatter: dateTimeFormatter,
      },
      {
        field: "openedByName",
        filterOperators: stringFilterOperators,
        headerName: tOrders("cashDrawer.sessions.openedByName"),
        renderCell: renderEmptyableCell,
      },
      moneyColumn("openingFloat", tOrders("cashDrawer.openingFloat")),
      {
        field: "closedAt",
        filterOperators: dateFilterOperators,
        headerName: tOrders("cashDrawer.sessions.closedAt"),
        renderCell: renderEmptyableCell,
        valueFormatter: dateTimeFormatter,
      },
      {
        field: "closedByName",
        filterOperators: stringFilterOperators,
        headerName: tOrders("cashDrawer.sessions.closedByName"),
        renderCell: renderEmptyableCell,
      },
      moneyColumn("expectedCash", tOrders("cashDrawer.expectedCash")),
      moneyColumn("countedCash", tOrders("cashDrawer.countedCash")),
      {
        field: "variance",
        filterOperators: numberFilterOperators,
        headerName: tOrders("cashDrawer.sessions.variance"),
        renderCell: ({
          row: { variance },
        }: GridRenderCellParams<CashDrawerSessionListItem>) =>
          variance == null ? (
            <EmptyCell />
          ) : (
            <Chip
              color={Number(variance) === 0 ? "default" : "warning"}
              label={formatMoney(Number(variance), currency)}
              size="small"
              variant="outlined"
            />
          ),
        type: "number",
      },
      moneyColumn("retainedFloat", tOrders("cashDrawer.retainedFloat")),
      {
        field: "varianceNote",
        filterOperators: stringFilterOperators,
        headerName: tOrders("cashDrawer.varianceNote"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
    ];
  }, [
    currency,
    dateFilterOperators,
    enumFilterOperators,
    enumOptions,
    format,
    formatMoney,
    numberFilterOperators,
    stringFilterOperators,
    tOrders,
  ]);

  return (
    <>
      <Typography variant="subtitle1">
        {tOrders("cashDrawer.sessions.label")}
      </Typography>
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
            exportDateField: "openedAt",
          },
        }}
      />
    </>
  );
};

export default CashDrawerSessions;
