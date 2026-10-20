"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";

import { pnlColor } from "../useQuantBots";

import { quantPairOf } from "@/constants/quant";

import {
  DialogContentText,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { quantGridCloseModelValues } from "@/types/api";
import type { GridConfig, QuantBot, StopQuantBotDto } from "@/types/quant";

type CloseModel = GridConfig["closeModel"];

const consequenceOf = (
  { summary, type }: QuantBot,
  closeModel?: CloseModel,
) => {
  if (type === "futures_grid")
    return summary.pionexStatus === "close_position"
      ? "futuresGridClosing"
      : "futuresGrid";
  if (type === "grid")
    return closeModel === "TO_QUOTE" ? "gridSell" : "gridKeep";
  if (type === "signal") return "cancelOrders";

  return "keepPosition";
};

interface StopBotConfirmProps {
  bot: QuantBot;
  onStop: (dto: StopQuantBotDto) => Promise<void>;
}

const StopBotConfirm = ({ bot, onStop }: StopBotConfirmProps) => {
  const tBots = useTranslations("quant.bots");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const [closeModel, setCloseModel] = useState(
    bot.type === "grid" ? (bot.config as GridConfig).closeModel : undefined,
  );

  const pair = quantPairOf(bot.symbol);
  const [base, quote] = pair.split("/");

  const changeCloseModel = (value: CloseModel) => {
    setCloseModel(value);
    setDialog({ onConfirm: () => onStop({ closeModel: value }) });
  };

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
        {tBots(`actions.stop.consequences.${consequenceOf(bot, closeModel)}`, {
          base,
          quote,
        })}
      </DialogContentText>
      {closeModel && (
        <FormControl>
          <FormLabel>{tBots("form.grid.closeModel.label")}</FormLabel>
          <RadioGroup
            onChange={(_, value) => changeCloseModel(value as CloseModel)}
            row
            value={closeModel}
          >
            {quantGridCloseModelValues.map((value) => (
              <FormControlLabel
                control={<Radio />}
                key={value}
                label={tBots(`form.grid.closeModel.${value}`, { quote })}
                value={value}
              />
            ))}
          </RadioGroup>
        </FormControl>
      )}
      {bot.startedAt && !bot.summary.pionexError && (
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
