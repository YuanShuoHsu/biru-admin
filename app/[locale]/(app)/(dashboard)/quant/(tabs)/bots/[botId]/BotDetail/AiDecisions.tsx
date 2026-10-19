"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { QUANT_BOTS_URL, useBotLabels } from "../../useQuantBots";

import { MAX_PAGE_SIZE } from "@/constants/pagination";

import {
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

import type { AiConfig, QuantBot, QuantBotEvent } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const AI_EVENT_KINDS = ["ai_decision", "ai_error", "ai_refusal"];

const ACTION_COLORS = {
  close: "error",
  hold: "default",
  open: "success",
} as const;

const AiDecisions = ({ bot }: { bot: QuantBot }) => {
  const tAi = useTranslations("quant.bots.ai");
  const format = useFormatter();
  const labels = useBotLabels();

  const params = new URLSearchParams({ limit: String(MAX_PAGE_SIZE) });
  for (const kind of AI_EVENT_KINDS) params.append("kinds", kind);
  const { data: { data: decisions } = { data: [] } } = useSWR<{
    data: QuantBotEvent[];
  }>(`${QUANT_BOTS_URL}/${bot.id}/events?${params}`, fetcher);

  const config = bot.config as AiConfig;
  const spent = bot.summary.aiMonthCost ?? 0;
  const usd = (value: number) =>
    format.number(value, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  return (
    <Stack sx={{ gap: 1.5 }}>
      <Typography variant="h6">{tAi("title")}</Typography>
      <Stack sx={{ gap: 0.5 }}>
        <Typography color="text.secondary" variant="body2">
          {tAi("cost", {
            cost: usd(spent),
            limit: usd(config.monthlyCostLimit),
          })}
        </Typography>
        <LinearProgress
          color={spent >= config.monthlyCostLimit ? "error" : "primary"}
          value={Math.min(100, (spent / config.monthlyCostLimit) * 100)}
          variant="determinate"
        />
      </Stack>
      {!decisions.length && (
        <Typography color="text.secondary" variant="body2">
          {tAi("empty")}
        </Typography>
      )}
      {decisions.map(({ createdAt, id, kind, payload = {} }, index) => {
        const action = payload.action as keyof typeof ACTION_COLORS | undefined;

        return (
          <Stack key={id} sx={{ gap: 0.5 }}>
            {index > 0 && <Divider />}
            <Stack
              sx={{
                alignItems: "center",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <Typography color="text.secondary" variant="caption">
                {format.dateTime(new Date(createdAt), "dateTime")}
              </Typography>
              {kind === "ai_decision" && action && (
                <Chip
                  color={ACTION_COLORS[action]}
                  label={tAi(`actions.${action}`)}
                  size="small"
                />
              )}
              {kind === "ai_decision" &&
                typeof payload.confidence === "number" && (
                  <Typography variant="caption">
                    {tAi("confidence", {
                      value: format.number(payload.confidence, {
                        style: "percent",
                      }),
                    })}
                  </Typography>
                )}
              {kind === "ai_decision" && action !== "hold" && (
                <Typography
                  color={payload.executed ? "success.main" : "warning.main"}
                  variant="caption"
                >
                  {payload.executed
                    ? tAi("executed")
                    : tAi("skipped", {
                        reason: labels.skipReason(
                          String(payload.skipReason ?? ""),
                        ),
                      })}
                </Typography>
              )}
              {typeof payload.cost === "number" && (
                <Typography color="text.secondary" variant="caption">
                  ${usd(payload.cost)}
                </Typography>
              )}
            </Stack>
            <Typography variant="body2">
              {kind === "ai_refusal"
                ? tAi("refusal", { reason: String(payload.reason ?? "") })
                : kind === "ai_error"
                  ? tAi("error", { message: String(payload.message ?? "") })
                  : String(payload.reasoning ?? "")}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
};

export default AiDecisions;
