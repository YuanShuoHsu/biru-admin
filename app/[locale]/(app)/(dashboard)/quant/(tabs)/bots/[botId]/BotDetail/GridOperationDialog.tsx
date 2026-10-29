"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { QUANT_BOTS_URL, isQuantBotKey } from "../../useQuantBots";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormBox from "@/components/FormBox";

import { InputAdornment, TextField, Typography } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  GridConfig,
  GridOperationDto,
  QuantBot,
  QuantMarket,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const GRID_OPERATION_FORM_ID = "quant-grid-operation";

export type GridOperation = GridOperationDto["operation"];

interface Fields {
  amount: string;
  bottom: string;
  row: string;
  top: string;
}

const optional = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

const toDto = (operation: GridOperation, fields: Fields): GridOperationDto =>
  operation === "range"
    ? {
        bottom: optional(fields.bottom),
        operation,
        row: optional(fields.row),
        top: optional(fields.top),
      }
    : { amount: optional(fields.amount), operation };

interface GridOperationDialogProps {
  bot: QuantBot;
  market?: QuantMarket;
  operation: GridOperation;
}

const GridOperationDialog = ({
  bot,
  market,
  operation,
}: GridOperationDialogProps) => {
  const tOperation = useTranslations("quant.bots.gridOperation");
  const tGrid = useTranslations("quant.bots.form.grid");
  const format = useFormatter();
  const { mutate } = useSWRConfig();
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const config = bot.config as GridConfig;
  const [fields, setFields] = useState<Fields>({
    amount: "",
    bottom: String(config.bottom),
    row: String(config.row),
    top: String(config.top),
  });

  const quote = market?.quoteCurrency ?? "";
  const formatQuote = (value: number) =>
    format.number(value, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();
    setDialog({ confirmLoading: true });
    try {
      await fetcher(`${QUANT_BOTS_URL}/${bot.id}/grid/operate`, {
        body: JSON.stringify(toDto(operation, fields)),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      enqueueSnackbar(tOperation("success"), { variant: "success" });
      closeDialog();
      void mutate(isQuantBotKey);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  const numberField = (
    name: keyof Fields,
    label: string,
    adornment?: string,
    helperText?: string,
  ) => (
    <TextField
      fullWidth
      helperText={helperText}
      label={label}
      onChange={(event) =>
        setFields((current) => ({ ...current, [name]: event.target.value }))
      }
      slotProps={{
        htmlInput: { inputMode: "decimal" },
        input: adornment
          ? {
              endAdornment: (
                <InputAdornment position="end">{adornment}</InputAdornment>
              ),
            }
          : undefined,
      }}
      value={fields[name]}
    />
  );

  return (
    <>
      <CustomizedDialogContent>
        <FormBox id={GRID_OPERATION_FORM_ID} noValidate onSubmit={onSubmit}>
          <Typography color="text.secondary" variant="body2">
            {tOperation(`descriptions.${operation}`)}
          </Typography>
          {operation === "invest" &&
            numberField("amount", tOperation("amount"), quote)}
          {operation === "profit" &&
            numberField(
              "amount",
              tOperation("amount"),
              quote,
              tOperation("profitHelper", {
                profit: formatQuote(bot.summary.realizedPnl),
                quote,
                withdrawn: formatQuote(bot.summary.profitWithdrawn ?? 0),
              }),
            )}
          {operation === "range" && (
            <>
              {numberField("top", tGrid("top"), quote)}
              {numberField("bottom", tGrid("bottom"), quote)}
              {numberField("row", tGrid("row"))}
            </>
          )}
        </FormBox>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default GridOperationDialog;
