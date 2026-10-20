"use client";

import { useFormatter, useTranslations } from "next-intl";

import { quantPairOf } from "@/constants/quant";

import { DialogContentText } from "@mui/material";

import type { QuantBot } from "@/types/quant";

const consequenceOf = ({ executor, mode }: QuantBot) =>
  mode === "paper" ? "paper" : executor === "pionex" ? "pionex" : "engine";

const StartBotConfirm = ({ bot }: { bot: QuantBot }) => {
  const tBots = useTranslations("quant.bots");
  const format = useFormatter();

  const pair = quantPairOf(bot.symbol);
  const quote = pair.split("/")[1];

  return (
    <DialogContentText>
      {tBots.rich("actions.start.confirm", {
        bold: (chunks) => <strong>{chunks}</strong>,
        name: bot.name,
        pair,
        type: tBots(`types.${bot.type}`),
      })}
      <br />
      {tBots(`actions.start.consequences.${consequenceOf(bot)}`, {
        investment: format.number(bot.investment, {
          maximumFractionDigits: 2,
        }),
        quote,
      })}
    </DialogContentText>
  );
};

export default StartBotConfirm;
