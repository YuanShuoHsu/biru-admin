"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";

import { pnlColor } from "../useQuantBots";

import { quantMarketTypeOf, quantPairOf } from "@/constants/quant";

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

const POSITION_BOT_TYPES = new Set(["ai", "dca", "indicator", "webhook"]);

const consequenceOf = (
  { summary, type }: QuantBot,
  isFutures: boolean,
  closeModel?: CloseModel,
) => {
  if (type === "futures_grid")
    return summary.pionexStatus === "close_position"
      ? "futuresGridClosing"
      : "futuresGrid";
  if (type === "grid")
    return closeModel === "TO_QUOTE" ? "gridSell" : "gridKeep";
  if (type === "signal") return "cancelOrders";
  if (isFutures) return "closePosition";

  return closeModel === "TO_QUOTE" ? "closePosition" : "keepPosition";
};

interface StopBotConfirmProps {
  bot: QuantBot;
  onStop: (dto: StopQuantBotDto) => Promise<void>;
}

const StopBotConfirm = ({ bot, onStop }: StopBotConfirmProps) => {
  const tBots = useTranslations("quant.bots");
  const format = useFormatter();
  const setDialog = useDialogStore((state) => state.setDialog);

  const isGrid = bot.type === "grid";
  // 合約一律平倉，對齊 Pionex 合約網格與合約馬丁格爾
  const isFutures = quantMarketTypeOf(bot.symbol) === "PERP";
  // 預設保留倉位，和不帶參數停止時的後端行為一致
  const [closeModel, setCloseModel] = useState<CloseModel | undefined>(
    isGrid
      ? (bot.config as GridConfig).closeModel
      : POSITION_BOT_TYPES.has(bot.type) && !isFutures
        ? "NOT_SELL"
        : undefined,
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
        {tBots(
          `actions.stop.consequences.${consequenceOf(bot, isFutures, closeModel)}`,
          {
            base,
            quote,
          },
        )}
      </DialogContentText>
      {closeModel && (
        <FormControl>
          <FormLabel>
            {tBots(
              isGrid
                ? "form.grid.closeModel.label"
                : "actions.stop.position.label",
            )}
          </FormLabel>
          <RadioGroup
            onChange={(_, value) => changeCloseModel(value as CloseModel)}
            row
            value={closeModel}
          >
            {quantGridCloseModelValues.map((value) => (
              <FormControlLabel
                control={<Radio />}
                key={value}
                label={
                  isGrid
                    ? tBots(`form.grid.closeModel.${value}`, { quote })
                    : tBots(`actions.stop.position.${value}`)
                }
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
