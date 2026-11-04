"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import useSWR from "swr";

import { QUANT_BOTS_URL, useBotLabels } from "../../useQuantBots";
import { useBotMarket } from "../useBotMarket";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";

import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Box } from "@mui/material";
import type {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";

import type { SortDirection } from "@/types/dataGrid";
import type {
  QuantBot,
  QuantBotEvent,
  QuantBotEventSortField,
  QuantBotFill,
  QuantBotFillSortField,
  QuantBotOrder,
  QuantBotOrderSortField,
} from "@/types/quant";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { fetcher } from "@/utils/fetcher";

const GRID_HEIGHT = 420;
const TIME_COLUMN_MIN_WIDTH = 180;

export type BotRecordTab = "events" | "fills" | "orders";

export interface BotRecordListResponse {
  data: (QuantBotEvent | QuantBotFill | QuantBotOrder)[];
  total: number;
}

export type BotRecordSortField =
  | QuantBotEventSortField
  | QuantBotFillSortField
  | QuantBotOrderSortField;

interface BotRecordsProps {
  bot?: QuantBot;
  loading?: boolean;
  page?: number;
  pageSize?: number;
  rowCount?: number;
  rows?: BotRecordListResponse["data"];
  sortBy?: BotRecordSortField;
  sortDirection?: SortDirection;
  tab: BotRecordTab;
}

const BotRecords = ({
  bot,
  loading = false,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  rowCount: initialRowCount = 0,
  rows: initialRows = [],
  sortBy,
  sortDirection,
  tab,
}: BotRecordsProps) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: page - 1,
    pageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(
    sortBy && sortDirection ? [{ field: sortBy, sort: sortDirection }] : [],
  );

  const tBots = useTranslations("quant.bots");
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const labels = useBotLabels();

  const { base, formatPrice, formatQuote, formatSize } = useBotMarket(
    bot?.symbol,
  );

  const updateQuery = useUpdateQuery();

  const {
    data: { data: rows, total: rowCount } = {
      data: initialRows,
      total: initialRowCount,
    },
    isLoading,
  } = useSWR(
    !loading &&
      !!bot && [
        `${QUANT_BOTS_URL}/${bot.id}/${tab}`,
        paginationModel.page,
        paginationModel.pageSize,
        sortModel,
      ],
    async ([url]) =>
      fetcher<BotRecordListResponse>(
        `${url}?${getDataGridSearchParams(paginationModel, { items: [] }, sortModel)}`,
      ),
    {
      fallbackData: { data: initialRows, total: initialRowCount },
      keepPreviousData: true,
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

  const formatTime = (value: string) =>
    format.dateTime(new Date(value), "short");

  const sideCell = ({
    row,
  }: GridRenderCellParams<QuantBotFill | QuantBotOrder>) => (
    <Box
      component="span"
      sx={{ color: row.side === "BUY" ? "success.main" : "error.main" }}
    >
      {tQuant(`order.side.${row.side}`)}
    </Box>
  );

  const orderColumns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: tQuant("account.columns.time"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: string) => formatTime(value),
    },
    {
      field: "side",
      headerName: tQuant("account.columns.side"),
      renderCell: sideCell,
    },
    {
      field: "type",
      headerName: tQuant("account.columns.type"),
      valueFormatter: (value: QuantBotOrder["type"]) =>
        tQuant(`order.type.${value}`),
    },
    {
      field: "price",
      headerName: tQuant("account.columns.price"),
      valueFormatter: (value?: number) => formatPrice(value),
    },
    {
      field: "size",
      headerName: tQuant("account.columns.size"),
      minWidth: 140,
      sortable: false,
      valueGetter: (_, { amount, size }: QuantBotOrder) =>
        size !== undefined
          ? `${formatSize(size)} ${base}`
          : amount !== undefined
            ? formatQuote(amount)
            : "—",
    },
    {
      field: "filledSize",
      headerName: tQuant("account.columns.filled"),
      valueFormatter: (value: number) => formatSize(value),
    },
    {
      field: "status",
      headerName: tQuant("account.columns.status"),
      valueFormatter: (value: QuantBotOrder["status"]) =>
        value === "rejected"
          ? tBots("events.order_rejected")
          : tQuant(`account.status.${value}`),
    },
    { field: "tag", headerName: tBots("columns.tag"), minWidth: 140 },
  ];

  const fillColumns: GridColDef[] = [
    {
      field: "filledAt",
      headerName: tQuant("account.columns.time"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: string) => formatTime(value),
    },
    {
      field: "side",
      headerName: tQuant("account.columns.side"),
      renderCell: sideCell,
    },
    {
      field: "price",
      headerName: tQuant("account.columns.price"),
      valueFormatter: (value: number) => formatPrice(value),
    },
    {
      field: "size",
      headerName: tQuant("account.columns.size"),
      valueFormatter: (value: number) => formatSize(value),
    },
    {
      field: "fee",
      headerName: tQuant("account.columns.fee"),
      valueGetter: (_, { fee, feeCoin }: QuantBotFill) =>
        `${format.number(fee, "precise")} ${feeCoin}`,
    },
  ];

  const describeEvent = ({ kind, payload }: QuantBotEvent) => {
    const reason = payload?.reason;
    if (typeof reason === "string")
      return kind === "order_skipped"
        ? labels.skipReason(reason)
        : (labels.reason(reason) ?? reason);
    if (typeof payload?.message === "string") return payload.message;

    return payload ? JSON.stringify(payload) : "—";
  };

  const eventColumns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: tQuant("account.columns.time"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: string) => formatTime(value),
    },
    {
      field: "kind",
      headerName: tBots("detail.events"),
      valueFormatter: (value: string) => labels.event(value),
    },
    {
      field: "payload",
      flex: 1,
      headerName: "",
      sortable: false,
      valueGetter: (_, row: QuantBotEvent) => describeEvent(row),
    },
  ];

  const columns = {
    events: eventColumns,
    fills: fillColumns,
    orders: orderColumns,
  };

  return (
    <Box sx={{ height: GRID_HEIGHT }}>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns[tab]}
        disableColumnFilter
        loading={loading || isLoading}
        onPaginationModelChange={handlePaginationModelChange}
        onSortModelChange={handleSortModelChange}
        pageSizeOptions={getPageSizeOptions(paginationModel.pageSize)}
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={rowCount}
        rows={rows}
        showToolbar={false}
        sortingMode="server"
        sortModel={sortModel}
      />
    </Box>
  );
};

export default BotRecords;
