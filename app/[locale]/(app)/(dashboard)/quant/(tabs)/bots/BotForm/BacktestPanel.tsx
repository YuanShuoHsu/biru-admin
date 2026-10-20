"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";

import BacktestResultView from "./BacktestResultView";
import { toConfig } from "./definitions";
import type { BotForm } from "./fields";

import {
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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

interface BacktestPanelProps {
  form: BotForm;
  market?: QuantMarket;
  type: Exclude<QuantBotType, "ai" | "signal" | "webhook">;
}

const BacktestPanel = ({ form, market, type }: BacktestPanelProps) => {
  const tBacktest = useTranslations("quant.bots.backtest");
  const tQuant = useTranslations("quant");
  const format = useFormatter();

  const [interval, setCandleInterval] = useState<QuantCandleInterval>("15M");
  const [candleCount, setCandleCount] = useState(2000);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);

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
      {result && <BacktestResultView quote={quote} result={result} />}
    </Stack>
  );
};

export default BacktestPanel;
