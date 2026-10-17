"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";

import {
  isQuantAccountKey,
  quantAccountUrl,
} from "../../../useQuantCredentials";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Close } from "@mui/icons-material";
import {
  Box,
  Button,
  DialogContentText,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  PlaceFuturesOrderDto,
  QuantCredential,
  QuantFundingFee,
  QuantFuturesAccount,
  QuantFuturesFill,
  QuantFuturesOrder,
  QuantMarket,
  QuantPosition,
  QuantPositionHistory,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const GRID_HEIGHT = 360;
const TIME_COLUMN_MIN_WIDTH = 180;

type FuturesTab =
  | "fills"
  | "funding"
  | "openOrders"
  | "orders"
  | "positionHistory"
  | "positions";

const pnlColor = (value: number) =>
  value > 0 ? "success.main" : value < 0 ? "error.main" : undefined;

interface FuturesAccountProps {
  credential: QuantCredential;
  market: QuantMarket;
  markets: QuantMarket[];
}

const FuturesAccount = ({
  credential,
  market,
  markets,
}: FuturesAccountProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);

  const [tab, setTab] = useState<FuturesTab>("positions");

  const url = (path: string) =>
    quantAccountUrl(credential.id, `futures${path}`);
  const symbolQuery = `?symbol=${market.symbol}`;

  const { data: account } = useSWR<QuantFuturesAccount>(url(""), fetcher);
  const { data: positions, isLoading: positionsLoading } = useSWR<
    QuantPosition[]
  >(url("/positions"), fetcher);
  const { data: openOrders, isLoading: openOrdersLoading } = useSWR<
    QuantFuturesOrder[]
  >(url(`/open-orders${symbolQuery}`), fetcher);
  const { data: orders, isLoading: ordersLoading } = useSWR<
    QuantFuturesOrder[]
  >(tab === "orders" ? url(`/orders${symbolQuery}`) : null, fetcher);
  const { data: fills, isLoading: fillsLoading } = useSWR<QuantFuturesFill[]>(
    tab === "fills" ? url(`/fills${symbolQuery}`) : null,
    fetcher,
  );
  const { data: positionHistory, isLoading: positionHistoryLoading } = useSWR<
    QuantPositionHistory[]
  >(tab === "positionHistory" ? url("/position-history") : null, fetcher);
  const { data: fundingFees, isLoading: fundingLoading } = useSWR<
    QuantFundingFee[]
  >(tab === "funding" ? url("/funding-fees") : null, fetcher);

  const revalidate = () => mutate(isQuantAccountKey(credential.id));

  const marketOf = (symbol: string) =>
    markets.find((item) => item.symbol === symbol) ?? market;
  const pairOf = (symbol: string) => {
    const { baseCurrency, quoteCurrency } = marketOf(symbol);

    return `${baseCurrency}/${quoteCurrency}`;
  };
  const formatPrice = (value: number | undefined, symbol: string) =>
    value === undefined || value === 0
      ? "—"
      : format.number(value, {
          maximumFractionDigits: marketOf(symbol).pricePrecision,
          minimumFractionDigits: marketOf(symbol).pricePrecision,
        });
  const formatSize = (value: number, symbol: string) =>
    format.number(value, {
      maximumFractionDigits: marketOf(symbol).sizePrecision,
    });
  const formatAmount = (value: number) =>
    format.number(value, { maximumFractionDigits: 4, signDisplay: "negative" });
  const formatTime = (value: number) =>
    format.dateTime(new Date(value), "short");

  const orderAction = ({
    positionSide,
    reduceOnly,
    side,
  }: Pick<QuantFuturesOrder, "positionSide" | "reduceOnly" | "side">) =>
    positionSide === "BOTH"
      ? `${tQuant(`order.side.${side}`)}${reduceOnly ? ` · ${tQuant("futures.reduceOnly")}` : ""}`
      : tQuant(
          `futures.actions.${(positionSide === "LONG") === (side === "BUY") ? "open" : "close"}${positionSide === "LONG" ? "Long" : "Short"}`,
        );

  const closePosition = (position: QuantPosition) =>
    setDialog({
      content: (
        <DialogContentText>
          {tQuant.rich("futures.closePosition.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            direction: tQuant(`futures.directions.${position.positionSide}`),
            pair: pairOf(position.symbol),
            size: formatSize(Math.abs(position.size), position.symbol),
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        const isLong = position.positionSide === "LONG";
        try {
          await fetcher(url("/orders"), {
            body: JSON.stringify({
              positionSide:
                account?.positionMode === "OPENCLOSE"
                  ? position.positionSide
                  : "BOTH",
              reduceOnly: account?.positionMode !== "OPENCLOSE",
              side: isLong ? "SELL" : "BUY",
              size: String(Math.abs(position.size)),
              symbol: position.symbol,
              type: "MARKET_QTY",
            } satisfies PlaceFuturesOrderDto),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          });
          enqueueSnackbar(tQuant("futures.closePosition.success"), {
            variant: "success",
          });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void revalidate();
        }
      },
      open: true,
      title: tQuant("futures.closePosition.title"),
    });

  const handleCancel = async (order: QuantFuturesOrder) => {
    try {
      await fetcher(url(`/orders/${order.orderId}?symbol=${order.symbol}`), {
        method: "DELETE",
      });
      enqueueSnackbar(tQuant("account.cancel.success"), {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      void revalidate();
    }
  };

  const handleCancelAll = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tQuant.rich("account.cancelAll.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count: openOrders?.length ?? 0,
            symbol: pairOf(market.symbol),
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(url(`/open-orders${symbolQuery}`), {
            method: "DELETE",
          });
          enqueueSnackbar(tQuant("account.cancelAll.success"), {
            variant: "success",
          });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void revalidate();
        }
      },
      open: true,
      title: tQuant("account.cancelAll.title"),
    });

  const symbolColumn: GridColDef = {
    field: "symbol",
    headerName: tQuant("market.symbol"),
    valueFormatter: (value: string) => pairOf(value),
  };
  const directionColumn: GridColDef = {
    field: "positionSide",
    headerName: tQuant("futures.columns.direction"),
    renderCell: ({
      row,
    }: GridRenderCellParams<QuantPosition | QuantPositionHistory>) => (
      <Box
        component="span"
        sx={{
          color: row.positionSide === "LONG" ? "success.main" : "error.main",
        }}
      >
        {tQuant(`futures.directions.${row.positionSide}`)}
      </Box>
    ),
  };

  const positionColumns: GridColDef[] = [
    {
      field: "actions",
      filterable: false,
      headerName: tQuant("account.columns.actions"),
      renderCell: ({ row }: GridRenderCellParams<QuantPosition>) => (
        <Button color="error" onClick={() => closePosition(row)} size="small">
          {tQuant("futures.closePosition.label")}
        </Button>
      ),
      sortable: false,
    },
    symbolColumn,
    directionColumn,
    {
      field: "leverage",
      headerName: tQuant("futures.columns.marginMode"),
      valueGetter: (_, { isolatedMode, leverage }: QuantPosition) =>
        `${tQuant(`futures.isolatedModes.${isolatedMode}`)} ${leverage}x`,
    },
    {
      field: "size",
      headerName: tQuant("account.columns.size"),
      valueGetter: (_, { size, symbol }: QuantPosition) =>
        `${formatSize(Math.abs(size), symbol)} ${marketOf(symbol).baseCurrency}`,
    },
    {
      field: "avgPrice",
      headerName: tQuant("futures.columns.avgPrice"),
      valueGetter: (_, { avgPrice, symbol }: QuantPosition) =>
        formatPrice(avgPrice, symbol),
    },
    {
      field: "markPrice",
      headerName: tQuant("market.markPrice"),
      valueGetter: (_, { markPrice, symbol }: QuantPosition) =>
        formatPrice(markPrice, symbol),
    },
    {
      field: "liquidationPrice",
      headerName: tQuant("futures.columns.liquidationPrice"),
      valueGetter: (_, { liquidationPrice, symbol }: QuantPosition) =>
        formatPrice(liquidationPrice, symbol),
    },
    {
      field: "initialMargin",
      headerName: tQuant("futures.columns.margin"),
      valueFormatter: (value: number) => formatAmount(value),
    },
    {
      field: "unrealizedPnL",
      headerName: tQuant("futures.columns.unrealizedPnL"),
      renderCell: ({ row }: GridRenderCellParams<QuantPosition>) => (
        <Box component="span" sx={{ color: pnlColor(row.unrealizedPnL) }}>
          {formatAmount(row.unrealizedPnL)}
          {row.initialMargin > 0 &&
            ` (${format.number(row.unrealizedPnL / row.initialMargin, {
              maximumFractionDigits: 2,
              signDisplay: "negative",
              style: "percent",
            })})`}
        </Box>
      ),
    },
  ];

  const orderColumns: GridColDef[] = [
    {
      field: "createTime",
      headerName: tQuant("account.columns.time"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: number) => formatTime(value),
    },
    {
      field: "side",
      headerName: tQuant("account.columns.side"),
      renderCell: ({ row }: GridRenderCellParams<QuantFuturesOrder>) => (
        <Box
          component="span"
          sx={{ color: row.side === "BUY" ? "success.main" : "error.main" }}
        >
          {orderAction(row)}
        </Box>
      ),
    },
    {
      field: "type",
      headerName: tQuant("account.columns.type"),
      valueFormatter: (value: QuantFuturesOrder["type"]) =>
        tQuant(`futures.orderTypes.${value}`),
    },
    {
      field: "price",
      headerName: tQuant("account.columns.price"),
      valueGetter: (_, { price, symbol }: QuantFuturesOrder) =>
        formatPrice(price, symbol),
    },
    {
      field: "size",
      headerName: tQuant("order.size"),
      valueGetter: (_, { size, symbol }: QuantFuturesOrder) =>
        formatSize(size, symbol),
    },
    {
      field: "filledSize",
      headerName: tQuant("account.columns.filled"),
      valueGetter: (_, { filledSize, symbol }: QuantFuturesOrder) =>
        formatSize(filledSize, symbol),
    },
  ];

  const openOrderColumns: GridColDef[] = [
    {
      field: "actions",
      filterable: false,
      headerName: tQuant("account.columns.actions"),
      renderCell: ({ row }: GridRenderCellParams<QuantFuturesOrder>) => (
        <Tooltip title={tQuant("account.cancel.label")}>
          <IconButton
            color="error"
            onClick={() => handleCancel(row)}
            size="small"
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
      sortable: false,
    },
    ...orderColumns,
  ];

  const historyColumns: GridColDef[] = [
    ...orderColumns,
    {
      field: "averagePrice",
      headerName: tQuant("account.columns.averagePrice"),
      valueGetter: (
        _,
        { filledAmount, filledSize, symbol }: QuantFuturesOrder,
      ) =>
        formatPrice(
          filledSize > 0 ? filledAmount / filledSize : undefined,
          symbol,
        ),
    },
    {
      field: "status",
      headerName: tQuant("account.columns.status"),
      valueGetter: (_, { filledSize, size, status }: QuantFuturesOrder) =>
        tQuant(
          `account.status.${
            status === "OPEN"
              ? "open"
              : filledSize === 0
                ? "canceled"
                : filledSize >= size
                  ? "filled"
                  : "partiallyCanceled"
          }`,
        ),
    },
  ];

  const fillColumns: GridColDef[] = [
    {
      field: "time",
      headerName: tQuant("account.columns.time"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: number) => formatTime(value),
    },
    {
      field: "side",
      headerName: tQuant("account.columns.side"),
      renderCell: ({ row }: GridRenderCellParams<QuantFuturesFill>) => (
        <Box
          component="span"
          sx={{ color: row.side === "BUY" ? "success.main" : "error.main" }}
        >
          {tQuant(`order.side.${row.side}`)}
        </Box>
      ),
    },
    {
      field: "role",
      headerName: tQuant("account.columns.role"),
      valueGetter: (_, { feeType, role }: QuantFuturesFill) =>
        feeType === "LIQUIDATION"
          ? tQuant("futures.liquidation")
          : tQuant(`order.role.${role}`),
    },
    {
      field: "price",
      headerName: tQuant("account.columns.price"),
      valueGetter: (_, { price }: QuantFuturesFill) =>
        formatPrice(price, market.symbol),
    },
    {
      field: "size",
      headerName: tQuant("order.size"),
      valueGetter: (_, { size }: QuantFuturesFill) =>
        formatSize(size, market.symbol),
    },
    {
      field: "fee",
      headerName: tQuant("account.columns.fee"),
      valueGetter: (_, { fee, feeCoin }: QuantFuturesFill) =>
        `${format.number(fee, "precise")} ${feeCoin}`,
    },
  ];

  const positionHistoryColumns: GridColDef[] = [
    {
      field: "closeTime",
      headerName: tQuant("futures.columns.closeTime"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: number) => formatTime(value),
    },
    symbolColumn,
    directionColumn,
    {
      field: "size",
      headerName: tQuant("futures.columns.maxSize"),
      valueGetter: (_, { size, symbol }: QuantPositionHistory) =>
        formatSize(size, symbol),
    },
    {
      field: "openPrice",
      headerName: tQuant("futures.columns.avgPrice"),
      valueGetter: (_, { openPrice, symbol }: QuantPositionHistory) =>
        formatPrice(openPrice, symbol),
    },
    {
      field: "closePrice",
      headerName: tQuant("futures.columns.closePrice"),
      valueGetter: (_, { closePrice, symbol }: QuantPositionHistory) =>
        formatPrice(closePrice, symbol),
    },
    {
      field: "realizedPnL",
      headerName: tQuant("futures.columns.realizedPnL"),
      renderCell: ({ row }: GridRenderCellParams<QuantPositionHistory>) => (
        <Box component="span" sx={{ color: pnlColor(row.realizedPnL) }}>
          {formatAmount(row.realizedPnL)}
          {row.liquidated && ` · ${tQuant("futures.liquidation")}`}
        </Box>
      ),
    },
  ];

  const fundingColumns: GridColDef[] = [
    {
      field: "time",
      headerName: tQuant("account.columns.time"),
      minWidth: TIME_COLUMN_MIN_WIDTH,
      valueFormatter: (value: number) => formatTime(value),
    },
    symbolColumn,
    {
      field: "rate",
      headerName: tQuant("futures.columns.fundingRate"),
      valueFormatter: (value: number) =>
        format.number(value, {
          maximumFractionDigits: 4,
          minimumFractionDigits: 4,
          style: "percent",
        }),
    },
    {
      field: "fee",
      headerName: tQuant("futures.columns.fundingFee"),
      renderCell: ({ row }: GridRenderCellParams<QuantFundingFee>) => (
        <Box component="span" sx={{ color: pnlColor(row.fee) }}>
          {`${format.number(row.fee, "precise")} ${row.coin}`}
        </Box>
      ),
    },
  ];

  const grids = {
    fills: { columns: fillColumns, loading: fillsLoading, rows: fills },
    funding: {
      columns: fundingColumns,
      loading: fundingLoading,
      rows: fundingFees?.map((fee) => ({
        ...fee,
        id: `${fee.symbol}:${fee.time}`,
      })),
    },
    openOrders: {
      columns: openOrderColumns,
      loading: openOrdersLoading,
      rows: openOrders?.map((order) => ({ ...order, id: order.orderId })),
    },
    orders: {
      columns: historyColumns,
      loading: ordersLoading,
      rows: orders?.map((order) => ({ ...order, id: order.orderId })),
    },
    positionHistory: {
      columns: positionHistoryColumns,
      loading: positionHistoryLoading,
      rows: positionHistory?.map((position) => ({
        ...position,
        id: position.positionId,
      })),
    },
    positions: {
      columns: positionColumns,
      loading: positionsLoading,
      rows: positions?.map((position) => ({
        ...position,
        id: position.positionId,
      })),
    },
  };
  const grid = grids[tab];

  return (
    <Stack sx={{ gap: 1 }}>
      <Stack
        sx={{
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Tabs
          onChange={(_, value: FuturesTab) => setTab(value)}
          scrollButtons="auto"
          value={tab}
          variant="scrollable"
        >
          <Tab
            label={`${tQuant("futures.positions")} (${positions?.length ?? 0})`}
            value="positions"
          />
          <Tab
            label={`${tQuant("account.openOrders")} (${openOrders?.length ?? 0})`}
            value="openOrders"
          />
          <Tab label={tQuant("account.orders")} value="orders" />
          <Tab label={tQuant("account.fills")} value="fills" />
          <Tab
            label={tQuant("futures.positionHistory")}
            value="positionHistory"
          />
          <Tab label={tQuant("futures.fundingFees")} value="funding" />
        </Tabs>
        {tab === "openOrders" && !!openOrders?.length && (
          <Button color="error" onClick={handleCancelAll} size="small">
            {tQuant("account.cancelAll.label")}
          </Button>
        )}
      </Stack>
      <Box sx={{ height: GRID_HEIGHT }}>
        <DataGrid
          {...DATA_GRID_PROPS}
          columns={grid.columns}
          key={tab}
          loading={grid.loading}
          rows={grid.rows ?? []}
          showToolbar={false}
        />
      </Box>
    </Stack>
  );
};

export default FuturesAccount;
