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
import { useBotMarket } from "../useBotMarket";
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

import RouteTabs from "@/components/RouteTabs";

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
  Button,
  Chip,
  DialogContentText,
  Grid,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AiConfig,
  FuturesGridConfig,
  FuturesPositionConfig,
  QuantBot,
  SignalBotConfig,
  StopQuantBotDto,
  WebhookToken,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const BotChart = dynamic(() => import("./BotChart"), { ssr: false });

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

interface BotDetailProps {
  botId: string;
  children: React.ReactNode;
}

const BotDetail = ({ botId, children }: BotDetailProps) => {
  const tBots = useTranslations("quant.bots");
  const format = useFormatter();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);
  const labels = useBotLabels();
  const openBotForm = useBotFormDialog();

  useBotStream(botId);

  const botUrl = `${QUANT_BOTS_URL}/${botId}`;
  const { data: bot, error } = useSWR<QuantBot>(botUrl, fetcher);
  const {
    base,
    formatPrice,
    formatQuote,
    formatSize,
    market,
    pricePrecision,
    quote,
  } = useBotMarket(bot?.symbol);

  const [operationAnchor, setOperationAnchor] = useState<HTMLElement | null>(
    null,
  );

  if (error) return <Alert severity="error">{getErrorMessage(error)}</Alert>;
  if (!bot) return <Skeleton height={480} variant="rounded" />;

  const isPionexGrid = bot.executor === "pionex";
  const isGrid = bot.type === "grid" || bot.type === "futures_grid";
  const futuresConfig =
    bot.type === "futures_grid" ? (bot.config as FuturesGridConfig) : null;
  const gridConfig = isGrid ? (bot.config as FuturesGridConfig) : null;
  const isFutures = quantMarketTypeOf(bot.symbol) === "PERP";
  const position = (bot.config as { futures?: FuturesPositionConfig }).futures;

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
        <Grid
          container
          spacing={2}
          sx={{ display: summary.pionexError ? "none" : undefined }}
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
          <RouteTabs
            ariaLabel={bot.name}
            tabs={[
              { path: `/quant/bots/${botId}/orders` },
              { path: `/quant/bots/${botId}/fills` },
              { path: `/quant/bots/${botId}/events` },
            ]}
          />
          {children}
        </Panel>
      )}
    </Stack>
  );
};

export default BotDetail;
