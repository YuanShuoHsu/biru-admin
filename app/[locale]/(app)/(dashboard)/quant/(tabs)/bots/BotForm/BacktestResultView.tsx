"use client";

import { useFormatter, useTranslations } from "next-intl";

import { useBotLabels } from "../useQuantBots";

import { Alert, Box, Grid, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";

import type { BacktestResult } from "@/types/quant";

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

interface BacktestResultViewProps {
  quote: string;
  result: BacktestResult;
}

const BacktestResultView = ({ quote, result }: BacktestResultViewProps) => {
  const tBacktest = useTranslations("quant.bots.backtest");
  const format = useFormatter();
  const labels = useBotLabels();
  const theme = useTheme();

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

  return (
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
  );
};

export default BacktestResultView;
