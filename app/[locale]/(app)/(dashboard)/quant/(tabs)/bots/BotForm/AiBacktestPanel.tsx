"use client";

import { useEffect, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR from "swr";

import BacktestResultView from "./BacktestResultView";
import { toConfig } from "./definitions";
import type { BotForm } from "./fields";

import {
  Alert,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

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

  const [candleCount, setCandleCount] = useState(CANDLE_COUNTS[0]);
  const [runId, setRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);

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

    setStarting(true);
    try {
      const created = await fetcher<QuantAiBacktest>(AI_BACKTESTS_URL, {
        body: JSON.stringify({
          candleCount,
          config: toConfig("ai", values) as AiConfig,
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

  // 這個面板在建立機器人的對話框裡，改用共用對話框確認會蓋掉整張表單
  const cancel = async () => {
    if (!run) return;

    setCanceling(true);
    try {
      await mutate(
        await fetcher<QuantAiBacktest>(`${AI_BACKTESTS_URL}/${run.id}/cancel`, {
          method: "POST",
        }),
        { revalidate: false },
      );
      setConfirmingCancel(false);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setCanceling(false);
    }
  };

  const isRunning = run?.status === "running";

  // 進度只在這個面板看得到；關掉表單就停止，免得本機代理或 API 在背後繼續消耗額度
  const runningId = isRunning ? run.id : null;
  useEffect(() => {
    if (!runningId) return;

    return () =>
      void fetcher(`${AI_BACKTESTS_URL}/${runningId}/cancel`, {
        method: "POST",
      }).catch(() => undefined);
  }, [runningId]);

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
      {isRunning && confirmingCancel ? (
        <Alert
          action={
            <Stack sx={{ flexDirection: "row", gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => setConfirmingCancel(false)}
                size="small"
              >
                {tAiBacktest("cancel.keep")}
              </Button>
              <Button
                color="inherit"
                loading={canceling}
                onClick={cancel}
                size="small"
                variant="outlined"
              >
                {tAiBacktest("cancel.label")}
              </Button>
            </Stack>
          }
          severity="warning"
        >
          {tAiBacktest("cancel.confirm")}
        </Alert>
      ) : isRunning ? (
        <Button
          color="error"
          onClick={() => setConfirmingCancel(true)}
          variant="outlined"
        >
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
