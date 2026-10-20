"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { QUANT_BOTS_URL } from "../../useQuantBots";

import { Alert, Stack, Typography } from "@mui/material";

import type { QuantAiRequest, QuantBot } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const REFRESH_MS = 15_000;

const AiRequests = ({ bot }: { bot: QuantBot }) => {
  const tAi = useTranslations("quant.bots.ai");
  const format = useFormatter();

  const url = `${QUANT_BOTS_URL}/${bot.id}/ai-requests`;
  const { data: requests = [] } = useSWR<QuantAiRequest[]>(url, fetcher, {
    refreshInterval: REFRESH_MS,
  });

  const latest = requests[0];
  // 下一根收盤會立刻開新的請求，所以看的是最近一筆已結束的請求有沒有被回應
  const lastResolved = requests.find(({ status }) => status !== "pending");
  return (
    <Stack sx={{ gap: 1.5 }}>
      <Typography variant="h6">{tAi("request.title")}</Typography>
      {latest?.status === "pending" && latest.expiresAt && (
        <Alert severity="info">
          {tAi("request.pending", {
            time: format.dateTime(new Date(latest.expiresAt), "dateTime"),
          })}
        </Alert>
      )}
      {lastResolved?.status === "expired" && !lastResolved.answeredAt && (
        <Alert severity="warning">{tAi("request.noResponse")}</Alert>
      )}
      {!requests.length && (
        <Typography color="text.secondary" variant="body2">
          {tAi("request.empty")}
        </Typography>
      )}
    </Stack>
  );
};

export default AiRequests;
