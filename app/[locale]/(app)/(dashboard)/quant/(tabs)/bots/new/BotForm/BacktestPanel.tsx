"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import { useBotLabels } from "../../useQuantBots";
import { toConfig } from "./definitions";
import type { BotForm } from "./fields";

import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";

import { quantCandleIntervalValues } from "@/types/api";
import type {
  BacktestResult,
  QuantBotType,
  QuantCandleInterval,
  QuantMarket,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

// 交易所最多只能往回取 10000 根
const CANDLE_COUNTS = [500, 2000, 5000, 10000];

const Metric = ({
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
    <Typography sx={{ color }} variant="subtitle1">
      {value}
    </Typography>
  </Stack>
);

interface BacktestPanelProps {
  form: BotForm;
  market?: QuantMarket;
  type: Exclude<QuantBotType, "webhook">;
}

const BacktestPanel = ({ form, market, type }: BacktestPanelProps) => {
  const tBacktest = useTranslations("quant.bots.backtest");
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const labels = useBotLabels();
  const theme = useTheme();

  const [interval, setCandleInterval] = useState<QuantCandleInterval>("15M");
  const [candleCount, setCandleCount] = useState(2000);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const percent = (value?: number, signed = false) =>
    value === undefined
      ? "—"
      : format.number(value, {
          maximumFractionDigits: 2,
          signDisplay: signed ? "exceptZero" : "auto",
          style: "percent",
        });
  const signColor = (value: number) =>
    value > 0 ? "success.main" : value < 0 ? "error.main" : undefined;

  const run = async () => {
    if (!(await form.trigger())) return;

    const values = form.getValues();
    const feePercent = Number(values.paperFeeRate);
    if (values.paperFeeRate.trim() === "" || !Number.isFinite(feePercent)) {
      enqueueSnackbar(tBacktest("needsFee"), { variant: "warning" });
      return;
    }

    setLoading(true);
    try {
      setResult(
        await fetcher<BacktestResult>(`/api/quant/backtests/${type}`, {
          body: JSON.stringify({
            candleCount,
            config: toConfig(type, values),
            feeRate: feePercent / 100,
            interval,
            investment: Number(values.investment),
            symbol: values.symbol,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const quote = market?.quoteCurrency ?? "";

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="h6">{tBacktest("label")}</Typography>
      <Grid container spacing={2}>
        {type !== "indicator" && (
          <Grid size={6}>
            <TextField
              fullWidth
              label={tBacktest("interval")}
              onChange={(event) =>
                setCandleInterval(event.target.value as QuantCandleInterval)
              }
              select
              size="small"
              value={interval}
            >
              {quantCandleIntervalValues.map((value) => (
                <MenuItem key={value} value={value}>
                  {tQuant(`intervals.${value}`)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
        <Grid size={type === "indicator" ? 12 : 6}>
          <TextField
            fullWidth
            label={tBacktest("candles")}
            onChange={(event) => setCandleCount(Number(event.target.value))}
            select
            size="small"
            value={candleCount}
          >
            {CANDLE_COUNTS.map((value) => (
              <MenuItem key={value} value={value}>
                {format.number(value)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
      <Button loading={loading} onClick={run} variant="outlined">
        {tBacktest("run")}
      </Button>
      {result && (
        <Stack sx={{ gap: 2 }}>
          <Typography color="text.secondary" variant="body2">
            {tBacktest("period", {
              from: format.dateTime(new Date(result.from), "dateTime"),
              to: format.dateTime(new Date(result.to), "dateTime"),
            })}
          </Typography>
          {result.stoppedReason && (
            <Alert severity="warning">
              {tBacktest("stoppedEarly", {
                reason: labels.reason(result.stoppedReason) ?? "",
              })}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid size={4}>
              <Metric
                color={signColor(result.pnl)}
                label={tBacktest("pnl")}
                value={`${format.number(result.pnl, { maximumFractionDigits: 2, signDisplay: "negative" })} ${quote}`}
              />
            </Grid>
            <Grid size={4}>
              <Metric
                color={signColor(result.returnRate)}
                label={tBacktest("returnRate")}
                value={percent(result.returnRate, true)}
              />
            </Grid>
            <Grid size={4}>
              <Metric
                label={tBacktest("maxDrawdown")}
                value={percent(result.maxDrawdown)}
              />
            </Grid>
            <Grid size={4}>
              <Metric
                label={tBacktest("winRate")}
                value={percent(result.winRate)}
              />
            </Grid>
            <Grid size={4}>
              <Metric
                label={tBacktest("sharpe")}
                value={
                  result.sharpe === undefined
                    ? "—"
                    : format.number(result.sharpe, { maximumFractionDigits: 2 })
                }
              />
            </Grid>
            <Grid size={4}>
              <Metric
                label={tBacktest("trades")}
                value={format.number(result.tradeCount)}
              />
            </Grid>
          </Grid>
          <Box sx={{ height: 240 }}>
            <LineChart
              grid={{ horizontal: true }}
              hideLegend
              margin={{ bottom: 0, left: 0 }}
              series={[
                {
                  color:
                    result.pnl >= 0
                      ? theme.vars.palette.success.main
                      : theme.vars.palette.error.main,
                  curve: "linear",
                  data: result.equity.map(({ value }) => value),
                  label: tBacktest("equity"),
                  showMark: false,
                  valueFormatter: (value) =>
                    `${format.number(value ?? 0, { maximumFractionDigits: 2 })} ${quote}`,
                },
              ]}
              xAxis={[
                {
                  data: result.equity.map(({ time }) => new Date(time)),
                  scaleType: "time",
                  valueFormatter: (value: Date) =>
                    format.dateTime(value, "monthDay"),
                },
              ]}
            />
          </Box>
          <Typography color="text.secondary" variant="caption">
            {tBacktest("note")}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default BacktestPanel;
