"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import useSWR, { useSWRConfig } from "swr";

import { QUANT_BOTS_URL, isQuantBotKey } from "../../useQuantBots";

import { quantPairOf } from "@/constants/quant";

import {
  Alert,
  Button,
  Chip,
  DialogContentText,
  Stack,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AiDecision, QuantAiRequest, QuantBot } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const REFRESH_MS = 15_000;

const ACTION_COLORS = {
  close: "error",
  hold: "default",
  open: "success",
} as const;

const AiRequests = ({ bot }: { bot: QuantBot }) => {
  const tAi = useTranslations("quant.bots.ai");
  const format = useFormatter();
  const { mutate: mutateGlobal } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);

  const url = `${QUANT_BOTS_URL}/${bot.id}/ai-requests`;
  const { data: requests = [], mutate } = useSWR<QuantAiRequest[]>(
    url,
    fetcher,
    { refreshInterval: REFRESH_MS },
  );

  const quote = quantPairOf(bot.symbol).split("/")[1];
  const latest = requests[0];
  const awaiting = requests.filter(
    ({ status }) => status === "awaiting_approval",
  );

  const describe = ({ action, amount, closeRatio }: AiDecision) =>
    action === "open"
      ? tAi("request.open", {
          amount: format.number(amount, { maximumFractionDigits: 2 }),
          quote,
        })
      : action === "close"
        ? tAi("request.close", {
            ratio: format.number(closeRatio, { style: "percent" }),
          })
        : tAi("actions.hold");

  const resolve = (request: QuantAiRequest, action: "approve" | "reject") =>
    setDialog({
      content: (
        <DialogContentText>
          {tAi(`request.${action}.confirm`, {
            decision: request.decision ? describe(request.decision) : "",
          })}
        </DialogContentText>
      ),
      onConfirm: async () => {
        try {
          await fetcher(`${url}/${request.id}/${action}`, { method: "POST" });
          enqueueSnackbar(tAi(`request.${action}.success`), {
            variant: "success",
          });
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          void mutate();
          void mutateGlobal(isQuantBotKey);
        }
      },
      open: true,
      title: tAi(`request.${action}.title`),
    });

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
      {latest?.status === "expired" && !latest.answeredAt && (
        <Alert severity="warning">{tAi("request.noResponse")}</Alert>
      )}
      {!requests.length && (
        <Typography color="text.secondary" variant="body2">
          {tAi("request.empty")}
        </Typography>
      )}
      {awaiting.map((request) => (
        <Alert
          action={
            <Stack sx={{ flexDirection: "row", gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => resolve(request, "reject")}
                size="small"
              >
                {tAi("request.reject.label")}
              </Button>
              <Button
                color="inherit"
                onClick={() => resolve(request, "approve")}
                size="small"
                variant="outlined"
              >
                {tAi("request.approve.label")}
              </Button>
            </Stack>
          }
          key={request.id}
          severity="warning"
        >
          <Stack sx={{ gap: 0.5 }}>
            <Stack
              sx={{
                alignItems: "center",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {request.decision && (
                <Chip
                  color={ACTION_COLORS[request.decision.action]}
                  label={describe(request.decision)}
                  size="small"
                />
              )}
              <Typography variant="caption">
                {tAi("request.meta", {
                  expires: request.expiresAt
                    ? format.dateTime(new Date(request.expiresAt), "dateTime")
                    : "—",
                  price: format.number(request.price),
                })}
              </Typography>
            </Stack>
            {request.decision && (
              <Typography variant="body2">
                {request.decision.reasoning}
              </Typography>
            )}
          </Stack>
        </Alert>
      ))}
    </Stack>
  );
};

export default AiRequests;
