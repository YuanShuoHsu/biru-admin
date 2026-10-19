"use client";

import { useFormatter, useTranslations } from "next-intl";

import { pnlColor } from "../useQuantBots";

import { quantPairOf } from "@/constants/quant";

import { DialogContentText, Stack, Typography } from "@mui/material";

import type { GridConfig, QuantBot } from "@/types/quant";

const consequenceOf = ({ config, type }: QuantBot) => {
  if (type === "futures_grid") return "futuresGrid";
  if (type === "grid")
    return (config as GridConfig).closeModel === "TO_QUOTE"
      ? "gridSell"
      : "gridKeep";
  if (type === "signal") return "cancelOrders";

  return "keepPosition";
};

const StopBotConfirm = ({ bot }: { bot: QuantBot }) => {
  const tBots = useTranslations("quant.bots");
  const format = useFormatter();

  const pair = quantPairOf(bot.symbol);
  const [base, quote] = pair.split("/");

  return (
    <Stack sx={{ gap: 2 }}>
      <DialogContentText>
        {tBots.rich("actions.stop.confirm", {
          bold: (chunks) => <strong>{chunks}</strong>,
          name: bot.name,
          pair,
          type: tBots(`types.${bot.type}`),
        })}
        <br />
        {tBots(`actions.stop.consequences.${consequenceOf(bot)}`, {
          base,
          quote,
        })}
      </DialogContentText>
      {bot.startedAt && (
        <Stack sx={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Typography variant="body2">
            {tBots("actions.stop.currentPnl")}
          </Typography>
          <Typography sx={{ color: pnlColor(bot.summary.pnl) }} variant="body2">
            {format.number(bot.summary.pnl, {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2,
              signDisplay: "negative",
            })}{" "}
            {quote}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default StopBotConfirm;
