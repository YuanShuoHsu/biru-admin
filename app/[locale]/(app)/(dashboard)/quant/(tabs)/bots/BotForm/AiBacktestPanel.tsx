"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import BacktestResultView from "./BacktestResultView";
import { toConfig } from "./definitions";
import type { BotForm } from "./fields";

import {
  Alert,
  Button,
  DialogContentText,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AiConfig,
  CreateAiBacktestDto,
  QuantAiBacktest,
  QuantMarket,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const AI_BACKTESTS_URL = "/api/quant/ai-backtests";
const CANDLE_COUNTS = [100, 200, 500];
const POLL_MS = 5_000;

interface AiBacktestPanelProps {
  form: BotForm;
  market?: QuantMarket;
}

const AiBacktestPanel = ({ form, market }: AiBacktestPanelProps) => {
  const tBacktest = useTranslations("quant.bots.backtest");
  const tAiBacktest = useTranslations("quant.bots.aiBacktest");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const [candleCount, setCandleCount] = useState(CANDLE_COUNTS[0]);
  const [runId, setRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const { data: run, mutate } = useSWR<QuantAiBacktest>(
    runId ? `${AI_BACKTESTS_URL}/${runId}` : null,
    fetcher,
    {
      refreshInterval: (latest) => (latest?.status === "running" ? POLL_MS : 0),
    },
  );

  const start = async () => {
    if (!(await form.trigger())) return;

    const values = form.getValues();
    const feePercent = Number(values.paperFeeRate);
    if (values.paperFeeRate.trim() === "" || !Number.isFinite(feePercent)) {
      enqueueSnackbar(tBacktest("needsFee"), { variant: "warning" });
      return;
    }

    setStarting(true);
    try {
      const created = await fetcher<QuantAiBacktest>(AI_BACKTESTS_URL, {
        body: JSON.stringify({
          candleCount,
          config: toConfig("ai", values) as AiConfig,
          feeRate: feePercent / 100,
          investment: Number(values.investment),
          symbol: values.symbol,
        } satisfies CreateAiBacktestDto),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      setRunId(created.id);
      void mutate(created, { revalidate: false });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setStarting(false);
    }
  };

  const cancel = () =>
    setDialog({
      content: (
        <DialogContentText>{tAiBacktest("cancel.confirm")}</DialogContentText>
      ),
      onConfirm: async () => {
        if (!run) return;

        await mutate(
          await fetcher<QuantAiBacktest>(
            `${AI_BACKTESTS_URL}/${run.id}/cancel`,
            { method: "POST" },
          ),
          { revalidate: false },
        );
      },
      open: true,
      title: tAiBacktest("cancel.title"),
    });

  const isRunning = run?.status === "running";

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="h6">{tBacktest("label")}</Typography>
      <Alert severity="info">{tAiBacktest("hint")}</Alert>
      <TextField
        disabled={isRunning}
        fullWidth
        helperText={tAiBacktest("candlesHelper")}
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
      {isRunning ? (
        <Button color="error" onClick={cancel} variant="outlined">
          {tAiBacktest("cancel.label")}
        </Button>
      ) : (
        <Button loading={starting} onClick={start} variant="outlined">
          {tBacktest("run")}
        </Button>
      )}
      {run && (
        <Stack sx={{ gap: 1 }}>
          <Typography color="text.secondary" variant="body2">
            {tBacktest("period", {
              from: format.dateTime(new Date(run.from), "dateTime"),
              to: format.dateTime(new Date(run.to), "dateTime"),
            })}
          </Typography>
          {isRunning && (
            <>
              <LinearProgress
                value={(run.decidedCount / run.candleCount) * 100}
                variant="determinate"
              />
              <Typography color="text.secondary" variant="caption">
                {tAiBacktest(`progress.${run.source}`, {
                  cost: format.number(run.cost, { maximumFractionDigits: 2 }),
                  decided: run.decidedCount,
                  total: run.candleCount,
                })}
              </Typography>
            </>
          )}
          {run.status === "failed" && (
            <Alert severity="error">
              {tAiBacktest("failed", {
                reason:
                  run.error === "ai_cost_limit"
                    ? tAiBacktest("costLimit")
                    : (run.error ?? ""),
              })}
            </Alert>
          )}
          {run.status === "canceled" && (
            <Alert severity="warning">{tAiBacktest("canceled")}</Alert>
          )}
        </Stack>
      )}
      {run?.status === "completed" && run.result && (
        <BacktestResultView
          quote={market?.quoteCurrency ?? ""}
          result={run.result}
        />
      )}
    </Stack>
  );
};

export default AiBacktestPanel;
