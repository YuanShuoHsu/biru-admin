"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { enqueueSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";

import {
  QUANT_BOTS_URL,
  isQuantBotKey,
  pnlColor,
  useBotLabels,
  useBotStream,
} from "../../useQuantBots";
import StartBotConfirm from "../../StartBotConfirm";
import StopBotConfirm from "../../StopBotConfirm";
import WebhookSetup from "../../WebhookSetup";
import { useBotFormDialog } from "../../BotForm";
import FuturesGridOperationDialog, {
  FUTURES_GRID_OPERATION_FORM_ID,
  type FuturesGridOperation,
} from "./FuturesGridOperationDialog";
import GridOperationDialog, {
  GRID_OPERATION_FORM_ID,
  type GridOperation,
} from "./GridOperationDialog";
import AiDecisions from "./AiDecisions";
import AiRequests from "./AiRequests";
import EquityChart from "./EquityChart";
import SignalPanel from "./SignalPanel";

import DataGrid from "@/components/DataGrid";
import ErrorAlert from "@/components/ErrorAlert";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE, getPageSizeOptions } from "@/constants/pagination";
import { quantMarketTypeOf, quantPairOf } from "@/constants/quant";

import {
  Archive,
  ContentCopy,
  Key,
  PlayArrow,
  Stop,
  Tune,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  DialogContentText,
  Grid,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type {
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  GridSortModel,
} from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AiConfig,
  FuturesGridConfig,
  FuturesPositionConfig,
  QuantBot,
  QuantBotEvent,
  QuantBotFill,
  QuantBotOrder,
  QuantMarket,
  SignalBotConfig,
  StopQuantBotDto,
  WebhookToken,
} from "@/types/quant";

import { getDataGridSearchParams } from "@/utils/dataGrid";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const BotChart = dynamic(() => import("./BotChart"), { ssr: false });

const GRID_HEIGHT = 420;
const TIME_COLUMN_MIN_WIDTH = 180;

const STATUS_COLORS = {
  error: "error",
  running: "success",
  stopped: "default",
} as const;

const Panel = styled(Paper)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
}));

type DetailTab = "events" | "fills" | "orders";

type DetailRow = QuantBotEvent | QuantBotFill | QuantBotOrder;

const FIRST_PAGE: GridPaginationModel = {
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

const Stat = ({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: string;
}) => (
  <Stack>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography sx={{ color }} variant="h6">
      {value}
    </Typography>
  </Stack>
);

const BotDetail = ({ botId }: { botId: string }) => {
  const tBots = useTranslations("quant.bots");
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);
  const labels = useBotLabels();
  const openBotForm = useBotFormDialog();

  useBotStream();

  const botUrl = `${QUANT_BOTS_URL}/${botId}`;
  const { data: bot, error } = useSWR<QuantBot>(botUrl, fetcher);
  const {
    data: markets,
    error: marketsError,
    mutate: mutateMarkets,
  } = useSWR<QuantMarket[]>(
    bot ? `/api/quant/markets?type=${quantMarketTypeOf(bot.symbol)}` : null,
    fetcher,
  );

  const [tab, setTab] = useState<DetailTab>("orders");
  const [paginationModel, setPaginationModel] =
    useState<GridPaginationModel>(FIRST_PAGE);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [operationAnchor, setOperationAnchor] = useState<HTMLElement | null>(
    null,
  );

  const {
    data: { data: rows, total: rowCount } = { data: [], total: 0 },
    error: rowsError,
    isLoading: rowsLoading,
    mutate: mutateRows,
  } = useSWR(
    [
      `${botUrl}/${tab}`,
      paginationModel.page,
      paginationModel.pageSize,
      sortModel,
    ],
    async ([url]) =>
      fetcher<{ data: DetailRow[]; total: number }>(
        `${url}?${getDataGridSearchParams(paginationModel, { items: [] }, sortModel)}`,
      ),
  );

  if (error) return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  if (!bot) return <Skeleton height={480} variant="rounded" />;

  const market = markets?.find(({ symbol }) => symbol === bot.symbol);
  const pricePrecision = market?.pricePrecision ?? 2;
  const sizePrecision = market?.sizePrecision ?? 6;
  const quote = market?.quoteCurrency ?? "";
  const base = market?.baseCurrency ?? "";
  const isPionexGrid = bot.executor === "pionex";
  const isGrid = bot.type === "grid" || bot.type === "futures_grid";
  const futuresConfig =
    bot.type === "futures_grid" ? (bot.config as FuturesGridConfig) : null;
  const gridConfig = isGrid ? (bot.config as FuturesGridConfig) : null;
  const isFutures = quantMarketTypeOf(bot.symbol) === "PERP";
  const position = (bot.config as { futures?: FuturesPositionConfig }).futures;

  const formatQuote = (value: number) =>
    `${format.number(value, { maximumFractionDigits: 2, minimumFractionDigits: 2, signDisplay: "negative" })} ${quote}`;
  const formatStop = (stop?: FuturesGridConfig["lossStop"]) => {
    if (!stop) return "—";
    if (stop.type === "profit_amount") return formatQuote(stop.value);
    if (stop.type === "profit_ratio")
      return format.number(stop.value / 100, {
        maximumFractionDigits: 2,
        style: "percent",
      });

    return format.number(stop.value, { maximumFractionDigits: pricePrecision });
  };
  const formatQuoteWithRatio = (value: number) =>
    `${formatQuote(value)} (${format.number(value / bot.investment, { maximumFractionDigits: 2, signDisplay: "exceptZero", style: "percent" })})`;
  const formatPrice = (value?: number) =>
    value === undefined
      ? "—"
      : format.number(value, {
          maximumFractionDigits: pricePrecision,
          minimumFractionDigits: pricePrecision,
        });
  const formatSize = (value?: number) =>
    value === undefined
      ? "—"
      : format.number(value, { maximumFractionDigits: sizePrecision });
  const formatTime = (value: string) =>
    format.dateTime(new Date(value), "short");
  const formatAnnualized = (value?: number) =>
    value === undefined
      ? "—"
      : format.number(value, {
          maximumFractionDigits: 2,
          roundingMode: "trunc",
          signDisplay: "exceptZero",
          style: "percent",
        });

  const request = async (
    path: string,
    success: string,
    body?: StopQuantBotDto,
  ) => {
    try {
      await fetcher(`${botUrl}/${path}`, {
        body: JSON.stringify(body ?? {}),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      enqueueSnackbar(success, { variant: "success" });
    } catch (requestError) {
      enqueueSnackbar(getErrorMessage(requestError), { variant: "error" });
    } finally {
      void mutate(isQuantBotKey);
    }
  };

  const canOperate =
    (bot.type === "grid" || bot.type === "futures_grid") &&
    bot.mode === "live" &&
    bot.status === "running";
  const isPaused = bot.summary.pionexStatus === "paused";
  const isClosing = bot.summary.pionexStatus === "close_position";
  const futuresOperations: FuturesGridOperation[] = [
    "invest",
    "range",
    "reinvest",
    "reduce",
    isPaused ? "resume" : "pause",
    "addMargin",
    "reduceMargin",
    "stops",
  ];
  const gridOperations: GridOperation[] = ["invest", "range", "profit"];

  const openGridOperation = (operation: GridOperation) => {
    setOperationAnchor(null);
    setDialog({
      confirmText: tBots("gridOperation.execute"),
      content: (
        <GridOperationDialog bot={bot} market={market} operation={operation} />
      ),
      formId: GRID_OPERATION_FORM_ID,
      open: true,
      title: tBots(`gridOperation.operations.${operation}`),
    });
  };

  const openOperation = (operation: FuturesGridOperation) => {
    setOperationAnchor(null);
    setDialog({
      confirmText: tBots(
        `futuresGridOperation.${operation === "stops" ? "execute" : "check"}`,
      ),
      content: (
        <FuturesGridOperationDialog
          bot={bot}
          market={market}
          operation={operation}
        />
      ),
      formId: FUTURES_GRID_OPERATION_FORM_ID,
      open: true,
      title: tBots(`futuresGridOperation.operations.${operation}`),
    });
  };

  const confirm = (action: "archive" | "start" | "stop") =>
    setDialog({
      content:
        action === "stop" ? (
          <StopBotConfirm
            bot={bot}
            onStop={(dto) =>
              request("stop", tBots("actions.stop.success"), dto)
            }
          />
        ) : action === "start" ? (
          <StartBotConfirm bot={bot} />
        ) : (
          <DialogContentText>
            {tBots.rich("actions.archive.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: bot.name,
            })}
          </DialogContentText>
        ),
      onConfirm: () => request(action, tBots(`actions.${action}.success`)),
      open: true,
      title: tBots(`actions.${action}.title`),
    });

  const regenerateToken = () =>
    setDialog({
      content: (
        <DialogContentText>
          {tBots("webhook.regenerate.confirm")}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          const { webhookToken } = await fetcher<WebhookToken>(
            `${botUrl}/webhook-token`,
            { method: "POST" },
          );
          enqueueSnackbar(tBots("webhook.regenerate.success"), {
            variant: "success",
          });
          setDialog({
            content: <WebhookSetup botId={bot.id} token={webhookToken} />,
            open: true,
            showCancel: false,
            title: tBots("webhook.title"),
          });
        } catch (requestError) {
          enqueueSnackbar(getErrorMessage(requestError), { variant: "error" });
        }
      },
      open: true,
      title: tBots("webhook.regenerate.title"),
    });

  const { summary } = bot;

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

  return (
    <Stack sx={{ gap: 2 }}>
      <Panel>
        <Stack
          sx={{
            alignItems: { md: "center" },
            flexDirection: { md: "row" },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h5">{bot.name}</Typography>
            <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
              <Chip label={tBots(`types.${bot.type}`)} size="small" />
              <Tooltip title={tBots(`executors.${bot.executor}.description`)}>
                <Chip
                  color={isPionexGrid ? "info" : "default"}
                  label={tBots(`executors.${bot.executor}.label`)}
                  size="small"
                  variant="outlined"
                />
              </Tooltip>
              <Chip label={quantPairOf(bot.symbol)} size="small" />
              {position && (
                <Chip
                  label={`${tBots(`form.futures.directions.${position.direction}`)} ${position.leverage}x`}
                  size="small"
                />
              )}
              {bot.type === "signal" && (
                <Chip
                  label={`${(bot.config as SignalBotConfig).leverage}x`}
                  size="small"
                />
              )}
              {futuresConfig && (
                <Chip
                  label={`${tBots(`form.futuresGrid.trends.${futuresConfig.trend}`)} ${futuresConfig.leverage}x`}
                  size="small"
                />
              )}
              <Chip
                color={bot.mode === "live" ? "warning" : "default"}
                label={tBots(`modes.${bot.mode}`)}
                size="small"
              />
              {isPaused && (
                <Chip
                  color="warning"
                  label={tBots("futuresGridOperation.paused")}
                  size="small"
                />
              )}
              {isClosing && (
                <Chip
                  color="warning"
                  label={tBots("futuresGridOperation.closing")}
                  size="small"
                />
              )}
              <Chip
                color={STATUS_COLORS[bot.status]}
                label={
                  bot.statusReason && bot.status !== "running"
                    ? `${labels.status(bot)}・${labels.reason(bot.statusReason)}`
                    : labels.status(bot)
                }
                size="small"
              />
            </Stack>
          </Stack>
          <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1 }}>
            {!bot.startedAt && (
              <Button
                color="success"
                onClick={() => confirm("start")}
                startIcon={<PlayArrow />}
                variant="contained"
              >
                {tBots("actions.start.label")}
              </Button>
            )}
            {bot.status === "running" && (
              <Button
                color="error"
                onClick={() => confirm("stop")}
                startIcon={<Stop />}
                variant="contained"
              >
                {tBots("actions.stop.label")}
              </Button>
            )}
            {canOperate && (
              <Button
                disabled={!!marketsError}
                onClick={(event) => setOperationAnchor(event.currentTarget)}
                startIcon={<Tune />}
                variant="outlined"
              >
                {tBots(
                  bot.type === "grid"
                    ? "gridOperation.label"
                    : "futuresGridOperation.label",
                )}
              </Button>
            )}
            {bot.type === "webhook" && (
              <Button
                onClick={regenerateToken}
                startIcon={<Key />}
                variant="outlined"
              >
                {tBots("webhook.regenerate.label")}
              </Button>
            )}
            <Button
              onClick={() => openBotForm({ fromId: bot.id })}
              startIcon={<ContentCopy />}
              variant="outlined"
            >
              {tBots("actions.duplicate")}
            </Button>
            {bot.status !== "running" && (
              <Button
                onClick={() => confirm("archive")}
                startIcon={<Archive />}
                variant="outlined"
              >
                {tBots("actions.archive.label")}
              </Button>
            )}
          </Stack>
        </Stack>
        <Menu
          anchorEl={operationAnchor}
          onClose={() => setOperationAnchor(null)}
          open={!!operationAnchor}
        >
          {bot.type === "grid"
            ? gridOperations.map((operation) => (
                <MenuItem
                  key={operation}
                  onClick={() => openGridOperation(operation)}
                >
                  {tBots(`gridOperation.operations.${operation}`)}
                </MenuItem>
              ))
            : futuresOperations.map((operation) => (
                <MenuItem
                  key={operation}
                  onClick={() => openOperation(operation)}
                >
                  {tBots(`futuresGridOperation.operations.${operation}`)}
                </MenuItem>
              ))}
        </Menu>
        {summary.pionexError && (
          <Alert severity="error">
            {tBots("pionexError", { error: summary.pionexError })}
          </Alert>
        )}
        {bot.status === "running" && labels.pause(bot.statusReason) && (
          <Alert severity="warning">{labels.pause(bot.statusReason)}</Alert>
        )}
        {marketsError && <ErrorAlert onRetry={() => mutateMarkets()} />}
        <Grid
          container
          spacing={2}
          sx={{
            display: summary.pionexError || marketsError ? "none" : undefined,
          }}
        >
          <Grid size={{ md: 2, sm: 4, xs: 6 }}>
            <Stat
              label={tBots(
                futuresConfig
                  ? "detail.summary.actualInvestment"
                  : "detail.summary.investment",
              )}
              value={formatQuote(bot.investment)}
            />
          </Grid>
          <Grid size={{ md: 2, sm: 4, xs: 6 }}>
            <Stat
              color={pnlColor(summary.pnl)}
              label={tBots("detail.summary.pnl")}
              value={formatQuoteWithRatio(summary.pnl)}
            />
          </Grid>
          <Grid size={{ md: 2, sm: 4, xs: 6 }}>
            <Stat
              color={pnlColor(summary.realizedPnl)}
              label={tBots(
                isGrid
                  ? "detail.summary.gridProfit"
                  : "detail.summary.realizedPnl",
              )}
              value={formatQuoteWithRatio(summary.realizedPnl)}
            />
          </Grid>
          <Grid size={{ md: 2, sm: 4, xs: 6 }}>
            <Stat
              color={pnlColor(summary.floatingPnl)}
              label={tBots(
                isPionexGrid && bot.type === "futures_grid"
                  ? "detail.summary.trendPnl"
                  : "detail.summary.floatingPnl",
              )}
              value={formatQuoteWithRatio(summary.floatingPnl)}
            />
          </Grid>
          <Grid size={{ md: 2, sm: 4, xs: 6 }}>
            <Stat
              color={pnlColor(summary.annualizedReturn ?? 0)}
              label={tBots("detail.summary.annualizedReturn")}
              value={formatAnnualized(summary.annualizedReturn)}
            />
          </Grid>
          {isGrid && (
            <Grid size={{ md: 2, sm: 4, xs: 6 }}>
              <Stat
                color={pnlColor(summary.gridAnnualizedReturn ?? 0)}
                label={tBots("detail.summary.gridAnnualizedReturn")}
                value={formatAnnualized(summary.gridAnnualizedReturn)}
              />
            </Grid>
          )}
          {gridConfig && (
            <Grid size={{ md: 4, sm: 8, xs: 12 }}>
              <Stat
                label={tBots("detail.summary.priceRange")}
                value={tBots("detail.summary.priceRangeValue", {
                  bottom: format.number(gridConfig.bottom, {
                    maximumFractionDigits: pricePrecision,
                  }),
                  row: gridConfig.row,
                  top: format.number(gridConfig.top, {
                    maximumFractionDigits: pricePrecision,
                  }),
                })}
              />
            </Grid>
          )}
          <Grid size={{ md: 2, sm: 4, xs: 6 }}>
            <Stat
              label={tBots("detail.summary.position")}
              value={`${formatSize(summary.position)} ${base}`}
            />
          </Grid>
          {summary.openPrice !== undefined && (
            <Grid size={{ md: 2, sm: 4, xs: 6 }}>
              <Stat
                label={tBots("detail.summary.openPrice")}
                value={formatPrice(summary.openPrice)}
              />
            </Grid>
          )}
          <Grid size={{ md: 2, sm: 4, xs: 6 }}>
            <Stat
              label={tBots("detail.summary.averageCost")}
              value={
                summary.position !== 0 ? formatPrice(summary.averageCost) : "—"
              }
            />
          </Grid>
          {futuresConfig?.extraMargin !== undefined && (
            <Grid size={{ md: 2, sm: 4, xs: 6 }}>
              <Stat
                label={tBots("detail.summary.extraMargin")}
                value={formatQuote(futuresConfig.extraMargin)}
              />
            </Grid>
          )}
          {isFutures && (
            <>
              <Grid size={{ md: 2, sm: 4, xs: 6 }}>
                <Stat
                  label={tBots("detail.summary.liquidationPrice")}
                  value={
                    summary.liquidationDistance === undefined
                      ? formatPrice(summary.liquidationPrice)
                      : `${formatPrice(summary.liquidationPrice)} (${format.number(summary.liquidationDistance, { maximumFractionDigits: 2, style: "percent" })})`
                  }
                />
              </Grid>
              <Grid size={{ md: 2, sm: 4, xs: 6 }}>
                <Stat
                  color={pnlColor(summary.fundingFee ?? 0)}
                  label={tBots("detail.summary.fundingFee")}
                  value={formatQuote(summary.fundingFee ?? 0)}
                />
              </Grid>
            </>
          )}
          {gridConfig && (
            <Grid size={{ md: 2, sm: 4, xs: 6 }}>
              <Stat
                label={tBots("detail.summary.stops")}
                value={`${formatStop(gridConfig.profitStop)} / ${formatStop(gridConfig.lossStop)}`}
              />
            </Grid>
          )}
          {!isPionexGrid && (
            <Grid size={{ md: 2, sm: 4, xs: 6 }}>
              <Stat
                label={tBots("detail.summary.fills")}
                value={format.number(summary.fillCount)}
              />
            </Grid>
          )}
        </Grid>
        {isPionexGrid && (
          <Alert severity="info">
            {tBots(
              bot.type === "signal"
                ? "detail.pionexSignal"
                : "detail.pionexGrid",
            )}
          </Alert>
        )}
      </Panel>
      {bot.type === "ai" &&
        (bot.config as AiConfig).source === "claude_code" &&
        bot.status === "running" && (
          <Panel>
            <AiRequests bot={bot} />
          </Panel>
        )}
      {bot.type === "ai" && (
        <Panel>
          <AiDecisions bot={bot} />
        </Panel>
      )}
      {bot.type === "signal" && bot.startedAt && (
        <Panel>
          <SignalPanel bot={bot} />
        </Panel>
      )}
      {bot.type === "webhook" && (
        <Panel>
          <Typography variant="h6">{tBots("webhook.title")}</Typography>
          <WebhookSetup botId={bot.id} />
        </Panel>
      )}
      <Panel>
        <BotChart bot={bot} pricePrecision={pricePrecision} />
      </Panel>
      {bot.startedAt && (
        <Panel>
          <EquityChart bot={bot} quote={quote} />
        </Panel>
      )}
      {!isPionexGrid && (
        <Panel>
          <Tabs
            onChange={(_, value: DetailTab) => {
              setTab(value);
              setPaginationModel(FIRST_PAGE);
              setSortModel([]);
            }}
            value={tab}
          >
            <Tab label={tBots("detail.orders")} value="orders" />
            <Tab label={tBots("detail.fills")} value="fills" />
            <Tab label={tBots("detail.events")} value="events" />
          </Tabs>
          {rowsError && <ErrorAlert onRetry={() => mutateRows()} />}
          {!rowsError && (
            <Box sx={{ height: GRID_HEIGHT }}>
              <DataGrid
                {...DATA_GRID_PROPS}
                columns={
                  tab === "orders"
                    ? orderColumns
                    : tab === "fills"
                      ? fillColumns
                      : eventColumns
                }
                disableColumnFilter
                key={tab}
                loading={rowsLoading}
                onPaginationModelChange={setPaginationModel}
                onSortModelChange={(newModel) => {
                  setSortModel(newModel);
                  setPaginationModel((previous) => ({ ...previous, page: 0 }));
                }}
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
          )}
        </Panel>
      )}
    </Stack>
  );
};

export default BotDetail;
