"use client";

import { useMemo, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";

import {
  isQuantAccountKey,
  quantAccountUrl,
} from "../../../useQuantCredentials";
import HistoryRangeToggle from "../HistoryRangeToggle";
import { useAccountHistory } from "../useAccountHistory";

import IsolatedMarginDialog, {
  ISOLATED_MARGIN_FORM_ID,
} from "./IsolatedMarginDialog";

import DataGrid from "@/components/DataGrid";

import { autosizeOptions, DATA_GRID_PROPS } from "@/constants/dataGrid";

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
import {
  type GridColDef,
  type GridRenderCellParams,
  useGridApiRef,
} from "@mui/x-data-grid";

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

type FuturesTab =
  | "fills"
  | "funding"
  | "openOrders"
  | "orders"
  | "positionHistory"
  | "positions";

type MarketSpec = Pick<
  QuantMarket,
  | "baseCurrency"
  | "pricePrecision"
  | "quoteCurrency"
  | "sizePrecision"
  | "symbol"
>;

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

  const apiRef = useGridApiRef();
  const autosizeOnData = {
    onSuccess: () => {
      setTimeout(() => {
        apiRef.current?.autosizeColumns(autosizeOptions);
      }, 0);
    },
  };

  const url = (path: string) =>
    quantAccountUrl(credential.id, `futures${path}`);
  const symbolQuery = `?symbol=${market.symbol}`;

  const { data: account } = useSWR<QuantFuturesAccount>(url(""), fetcher);
  const { data: positions, isLoading: positionsLoading } = useSWR<
    QuantPosition[]
  >(url("/positions"), fetcher, autosizeOnData);
  const { data: openOrders, isLoading: openOrdersLoading } = useSWR<
    QuantFuturesOrder[]
  >(url(`/open-orders${symbolQuery}`), fetcher, autosizeOnData);
  const ordersHistory = useAccountHistory<QuantFuturesOrder>(
    tab === "orders" ? url(`/orders${symbolQuery}`) : null,
    autosizeOnData.onSuccess,
  );
  const fillsHistory = useAccountHistory<QuantFuturesFill>(
    tab === "fills" ? url(`/fills${symbolQuery}`) : null,
    autosizeOnData.onSuccess,
  );
  const history =
    tab === "orders" ? ordersHistory : tab === "fills" ? fillsHistory : null;
  const { data: positionHistory, isLoading: positionHistoryLoading } = useSWR<
    QuantPositionHistory[]
  >(
    tab === "positionHistory" ? url("/position-history") : null,
    fetcher,
    autosizeOnData,
  );
  const { data: fundingFees, isLoading: fundingLoading } = useSWR<
    QuantFundingFee[]
  >(tab === "funding" ? url("/funding-fees") : null, fetcher, autosizeOnData);

  const revalidate = () => mutate(isQuantAccountKey(credential.id));

  const handleCancelAll = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tQuant.rich("account.cancelAll.confirm", {
            bold: (chunks) => <strong>{chunks}</strong>,
            count: openOrders?.length ?? 0,
            symbol: `${market.baseCurrency}/${market.quoteCurrency}`,
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

  const isHedgeMode = account?.positionMode === "OPENCLOSE";
  // markets 每次刷新都帶新報價，欄位只依交易對規格重建，否則自動欄寬會被重設
  const specsJson = JSON.stringify(
    [market, ...markets].map(
      ({
        baseCurrency,
        pricePrecision,
        quoteCurrency,
        sizePrecision,
        symbol,
      }) => ({
        baseCurrency,
        pricePrecision,
        quoteCurrency,
        sizePrecision,
        symbol,
      }),
    ),
  );
  const specs = useMemo(
    () => JSON.parse(specsJson) as MarketSpec[],
    [specsJson],
  );

  const {
    fillColumns,
    fundingColumns,
    historyColumns,
    openOrderColumns,
    positionColumns,
    positionHistoryColumns,
  } = useMemo(() => {
    const accountUrl = (path: string) =>
      quantAccountUrl(credential.id, `futures${path}`);
    const marketOf = (symbol: string) =>
      specs.find((item) => item.symbol === symbol) ?? specs[0];
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
      format.number(value, {
        maximumFractionDigits: 4,
        signDisplay: "negative",
      });
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
            await fetcher(accountUrl("/orders"), {
              body: JSON.stringify({
                positionSide: isHedgeMode ? position.positionSide : "BOTH",
                reduceOnly: !isHedgeMode,
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
            void mutate(isQuantAccountKey(credential.id));
          }
        },
        open: true,
        title: tQuant("futures.closePosition.title"),
      });

    const adjustMargin = (position: QuantPosition) =>
      setDialog({
        content: (
          <IsolatedMarginDialog
            onSaved={() => void mutate(isQuantAccountKey(credential.id))}
            position={position}
            quote={marketOf(position.symbol).quoteCurrency}
            url={accountUrl("/isolated-margin")}
          />
        ),
        formId: ISOLATED_MARGIN_FORM_ID,
        open: true,
        title: tQuant("futures.isolatedMargin.title", {
          pair: pairOf(position.symbol),
        }),
      });

    const handleCancel = async (order: QuantFuturesOrder) => {
      try {
        await fetcher(
          accountUrl(`/orders/${order.orderId}?symbol=${order.symbol}`),
          {
            method: "DELETE",
          },
        );
        enqueueSnackbar(tQuant("account.cancel.success"), {
          variant: "success",
        });
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        void mutate(isQuantAccountKey(credential.id));
      }
    };

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
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tQuant("account.columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<QuantPosition>) => (
          <Stack
            sx={{ alignItems: "center", flexDirection: "row", height: "100%" }}
          >
            <Button
              color="error"
              onClick={(event) => {
                event.stopPropagation();

                closePosition(row);
              }}
              size="small"
            >
              {tQuant("futures.closePosition.label")}
            </Button>
            {row.isolatedMode !== "CROSS" && (
              <Button
                onClick={(event) => {
                  event.stopPropagation();

                  adjustMargin(row);
                }}
                size="small"
              >
                {tQuant("futures.isolatedMargin.label")}
              </Button>
            )}
          </Stack>
        ),
        resizable: false,
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
        disableColumnMenu: true,
        disableExport: true,
        field: "actions",
        filterable: false,
        headerName: tQuant("account.columns.actions"),
        renderCell: ({ row }: GridRenderCellParams<QuantFuturesOrder>) => (
          <Tooltip title={tQuant("account.cancel.label")}>
            <IconButton
              color="error"
              onClick={(event) => {
                event.stopPropagation();

                void handleCancel(row);
              }}
              size="small"
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
        resizable: false,
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

    return {
      fillColumns,
      fundingColumns,
      historyColumns,
      openOrderColumns,
      positionColumns,
      positionHistoryColumns,
    };
  }, [
    credential.id,
    format,
    isHedgeMode,
    market.symbol,
    mutate,
    setDialog,
    specs,
    tQuant,
  ]);

  const grids = {
    fills: { ...fillsHistory.gridProps, columns: fillColumns },
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
      ...ordersHistory.gridProps,
      columns: historyColumns,
      rows: ordersHistory.gridProps.rows.map((order) => ({
        ...order,
        id: order.orderId,
      })),
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
          sx={{ flex: 1, minWidth: 0 }}
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
        {history && (
          <HistoryRangeToggle
            onChange={history.onRangeChange}
            value={history.range}
          />
        )}
      </Stack>
      <Box sx={{ height: GRID_HEIGHT }}>
        <DataGrid
          {...DATA_GRID_PROPS}
          {...grid}
          apiRef={apiRef}
          key={tab}
          rows={grid.rows ?? []}
        />
      </Box>
    </Stack>
  );
};

export default FuturesAccount;
