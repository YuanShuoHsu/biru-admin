"use client";

import { useEffect, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useWatch } from "react-hook-form";
import useSWR from "swr";

import BacktestResultView from "./BacktestResultView";
import { toConfig } from "./definitions";
import type { BotForm } from "./fields";

import ErrorAlert from "@/components/ErrorAlert";

import {
  Alert,
  Button,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
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
  ResumeAiBacktestDto,
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
  const [resuming, setResuming] = useState(false);
  const [costLimit, setCostLimit] = useState("");

  const symbol = useWatch({ control: form.control, name: "symbol" });

  const {
    data: run,
    error: runError,
    mutate,
  } = useSWR<QuantAiBacktest>(
    runId ? `${AI_BACKTESTS_URL}/${runId}` : null,
    fetcher,
    {
      refreshInterval: (latest) => (latest?.status === "running" ? POLL_MS : 0),
    },
  );
  const {
    data: history,
    error: historyError,
    mutate: mutateHistory,
  } = useSWR<QuantAiBacktest[]>(AI_BACKTESTS_URL, fetcher, {
    refreshInterval: (rows) =>
      rows?.some(({ status }) => status === "running") ? POLL_MS : 0,
  });
  const runs = history?.filter((item) => item.symbol === symbol) ?? [];

  const select = (item: QuantAiBacktest) => {
    setRunId(item.id);
    setConfirmingCancel(false);
    setCostLimit(String(item.config.monthlyCostLimit ?? ""));
    void mutate(item, { revalidate: false });
  };

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
      select(created);
      void mutateHistory();
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
      void mutateHistory();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setCanceling(false);
    }
  };

  const resume = async () => {
    if (!run) return;

    setResuming(true);
    try {
      await mutate(
        await fetcher<QuantAiBacktest>(`${AI_BACKTESTS_URL}/${run.id}/resume`, {
          body: JSON.stringify({
            ...(run.source === "claude_api" &&
              costLimit !== "" && { monthlyCostLimit: Number(costLimit) }),
          } satisfies ResumeAiBacktestDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
        { revalidate: false },
      );
      void mutateHistory();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setResuming(false);
    }
  };

  const isRunning = run?.status === "running";
  const canResume = run?.status === "canceled" || run?.status === "failed";

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
      {runError && <ErrorAlert onRetry={() => mutate()} />}
      {!runError && run && (
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
          {canResume && run.source === "claude_api" && (
            <TextField
              fullWidth
              helperText={tAiBacktest("resume.costHelper", {
                cost: format.number(run.cost, { maximumFractionDigits: 2 }),
              })}
              label={tAiBacktest("resume.costLimit")}
              onChange={(event) => setCostLimit(event.target.value)}
              type="number"
              value={costLimit}
            />
          )}
          {canResume && (
            <Button loading={resuming} onClick={resume} variant="outlined">
              {tAiBacktest("resume.label", {
                decided: run.decidedCount,
                total: run.candleCount,
              })}
            </Button>
          )}
        </Stack>
      )}
      {!runError && run?.result && (
        <>
          {run.status !== "completed" && (
            <Typography color="text.secondary" variant="caption">
              {tAiBacktest("partial")}
            </Typography>
          )}
          <BacktestResultView
            quote={market?.quoteCurrency ?? ""}
            result={run.result}
          />
        </>
      )}
      {historyError && <ErrorAlert onRetry={() => mutateHistory()} />}
      {!historyError && runs.length > 0 && (
        <Stack sx={{ gap: 1 }}>
          <Typography variant="subtitle1">
            {tAiBacktest("history.label")}
          </Typography>
          <List disablePadding>
            {runs.map((item) => (
              <ListItemButton
                disabled={isRunning && item.id !== run?.id}
                key={item.id}
                onClick={() => select(item)}
                selected={item.id === runId}
              >
                <ListItemText
                  primary={format.dateTime(
                    new Date(item.createdAt),
                    "dateTime",
                  )}
                  secondary={tAiBacktest("history.summary", {
                    decided: item.decidedCount,
                    status: tAiBacktest(`status.${item.status}`),
                    total: item.candleCount,
                  })}
                />
              </ListItemButton>
            ))}
          </List>
        </Stack>
      )}
    </Stack>
  );
};

export default AiBacktestPanel;
