"use client";

import { type BaseSyntheticEvent, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { QUANT_BOTS_URL, isQuantBotKey } from "../../useQuantBots";

import FormBox from "@/components/FormBox";

import {
  Alert,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  quantFuturesGridPauseModeValues,
  quantGridStopTypeValues,
} from "@/types/api";
import type {
  FuturesGridConfig,
  FuturesGridOperationCheck,
  FuturesGridOperationDto,
  QuantBot,
  QuantMarket,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const FUTURES_GRID_OPERATION_FORM_ID = "quant-futures-grid-operation";

export type FuturesGridOperation = FuturesGridOperationDto["operation"];

type StopType = (typeof quantGridStopTypeValues)[number];

interface Fields {
  amount: string;
  bottom: string;
  lossStop: string;
  lossStopHigh: string;
  lossStopType: StopType;
  pauseMode: "conditional" | "immediate";
  profitStop: string;
  profitStopType: StopType;
  reduceNum: string;
  row: string;
  top: string;
  triggerDown: string;
  triggerUp: string;
}

const text = (value?: number) => (value === undefined ? "" : String(value));
const optional = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

const toDto = (
  operation: FuturesGridOperation,
  fields: Fields,
): FuturesGridOperationDto => {
  switch (operation) {
    case "invest":
    case "addMargin":
    case "reduceMargin":
      return { amount: optional(fields.amount), operation };
    case "range":
      return {
        bottom: optional(fields.bottom),
        operation,
        row: optional(fields.row),
        top: optional(fields.top),
      };
    case "reduce":
      return { operation, reduceNum: optional(fields.reduceNum) };
    case "pause":
      return {
        operation,
        pauseMode: fields.pauseMode,
        triggerDown: optional(fields.triggerDown),
        triggerUp: optional(fields.triggerUp),
      };
    case "resume":
      return {
        operation,
        triggerDown: optional(fields.triggerDown),
        triggerUp: optional(fields.triggerUp),
      };
    case "stops": {
      const stop = (type: StopType, value: string) =>
        value.trim() === "" ? null : { type, value: Number(value) };

      return {
        lossStop: stop(fields.lossStopType, fields.lossStop),
        lossStopHigh: optional(fields.lossStopHigh) ?? null,
        operation,
        profitStop: stop(fields.profitStopType, fields.profitStop),
      };
    }
  }
};

interface FuturesGridOperationDialogProps {
  bot: QuantBot;
  market?: QuantMarket;
  operation: FuturesGridOperation;
}

const FuturesGridOperationDialog = ({
  bot,
  market,
  operation,
}: FuturesGridOperationDialogProps) => {
  const tOperation = useTranslations("quant.bots.futuresGridOperation");
  const tGrid = useTranslations("quant.bots.form.grid");
  const format = useFormatter();
  const { mutate } = useSWRConfig();
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const config = bot.config as FuturesGridConfig;
  const [fields, setFields] = useState<Fields>({
    amount: "",
    bottom: text(config.bottom),
    lossStop: text(config.lossStop?.value),
    lossStopHigh: text(config.lossStopHigh),
    lossStopType: config.lossStop?.type ?? "price",
    pauseMode: "immediate",
    profitStop: text(config.profitStop?.value),
    profitStopType: config.profitStop?.type ?? "price",
    reduceNum: "",
    row: text(config.row),
    top: text(config.top),
    triggerDown: "",
    triggerUp: "",
  });
  const [check, setCheck] = useState<FuturesGridOperationCheck | null>(null);

  const quote = market?.quoteCurrency ?? "";
  const url = `${QUANT_BOTS_URL}/${bot.id}/futures-grid`;
  // 停利停損沒有試算端點，直接執行
  const needsCheck = operation !== "stops";

  const update = (patch: Partial<Fields>) => {
    setFields((current) => ({ ...current, ...patch }));
    setCheck(null);
    setDialog({ confirmText: tOperation(needsCheck ? "check" : "execute") });
  };

  const post = (path: "check" | "operate") =>
    fetcher<FuturesGridOperationCheck>(`${url}/${path}`, {
      body: JSON.stringify(toDto(operation, fields)),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();
    setDialog({ confirmLoading: true });
    try {
      if (needsCheck && !check?.ok) {
        const result = await post("check");
        setCheck(result);
        setDialog({
          confirmLoading: false,
          confirmText: tOperation(result.ok ? "execute" : "check"),
        });
        return;
      }

      await post("operate");
      enqueueSnackbar(tOperation("success"), { variant: "success" });
      closeDialog();
      void mutate(isQuantBotKey);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  const formatPrice = (value?: number) =>
    value === undefined
      ? "—"
      : format.number(value, {
          maximumFractionDigits: market?.pricePrecision ?? 2,
        });

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
      onChange={(event) => update({ [name]: event.target.value })}
      size="small"
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

  const stopTypeField = (name: "lossStopType" | "profitStopType") => (
    <TextField
      label={tGrid(name === "lossStopType" ? "lossStop" : "profitStop")}
      onChange={(event) => update({ [name]: event.target.value as StopType })}
      select
      size="small"
      sx={{ minWidth: 120 }}
      value={fields[name]}
    >
      {quantGridStopTypeValues.map((value) => (
        <MenuItem key={value} value={value}>
          {tGrid(`stopType.${value}`)}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <FormBox id={FUTURES_GRID_OPERATION_FORM_ID} noValidate onSubmit={onSubmit}>
      <Typography color="text.secondary" variant="body2">
        {tOperation(`descriptions.${operation}`)}
      </Typography>
      {(operation === "invest" ||
        operation === "addMargin" ||
        operation === "reduceMargin") &&
        numberField("amount", tOperation("amount"), quote)}
      {operation === "range" && (
        <>
          {numberField("top", tGrid("top"), quote)}
          {numberField("bottom", tGrid("bottom"), quote)}
          {numberField("row", tGrid("row"))}
        </>
      )}
      {operation === "reduce" &&
        numberField(
          "reduceNum",
          tOperation("reduceNum"),
          undefined,
          check?.maxReduceNum === undefined
            ? tOperation("reduceNumHelper")
            : tOperation("reduceNumMax", { max: check.maxReduceNum }),
        )}
      {operation === "pause" && (
        <TextField
          label={tOperation("pauseMode")}
          onChange={(event) =>
            update({
              pauseMode: event.target.value as Fields["pauseMode"],
            })
          }
          select
          size="small"
          value={fields.pauseMode}
        >
          {quantFuturesGridPauseModeValues.map((value) => (
            <MenuItem key={value} value={value}>
              {tOperation(`pauseModes.${value}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
      {((operation === "pause" && fields.pauseMode === "conditional") ||
        operation === "resume") && (
        <>
          {numberField(
            "triggerUp",
            tOperation("triggerUp"),
            quote,
            tOperation("triggerOptional"),
          )}
          {numberField(
            "triggerDown",
            tOperation("triggerDown"),
            quote,
            tOperation("triggerOptional"),
          )}
        </>
      )}
      {operation === "stops" && (
        <>
          <Stack sx={{ flexDirection: "row", gap: 1 }}>
            {stopTypeField("lossStopType")}
            {numberField(
              "lossStop",
              tGrid("lossStop"),
              quote,
              tOperation("stopClearHelper"),
            )}
          </Stack>
          {config.trend === "no_trend" &&
            numberField(
              "lossStopHigh",
              tOperation("lossStopHigh"),
              quote,
              tOperation("stopClearHelper"),
            )}
          <Stack sx={{ flexDirection: "row", gap: 1 }}>
            {stopTypeField("profitStopType")}
            {numberField(
              "profitStop",
              tGrid("profitStop"),
              quote,
              tOperation("stopClearHelper"),
            )}
          </Stack>
        </>
      )}
      {check && (
        <Alert severity={check.ok ? "info" : "error"}>
          <Stack sx={{ gap: 0.5 }}>
            {!check.ok && (
              <Typography variant="body2">
                {tOperation("rejected", { reason: check.reason ?? "" })}
              </Typography>
            )}
            {(check.liquidationPriceDownAfter !== undefined ||
              check.liquidationPriceDownBefore !== undefined) && (
              <Typography variant="body2">
                {tOperation("liquidationDown", {
                  after: formatPrice(check.liquidationPriceDownAfter),
                  before: formatPrice(check.liquidationPriceDownBefore),
                })}
              </Typography>
            )}
            {(check.liquidationPriceUpAfter !== undefined ||
              check.liquidationPriceUpBefore !== undefined) && (
              <Typography variant="body2">
                {tOperation("liquidationUp", {
                  after: formatPrice(check.liquidationPriceUpAfter),
                  before: formatPrice(check.liquidationPriceUpBefore),
                })}
              </Typography>
            )}
            {check.maxAmount !== undefined && (
              <Typography variant="body2">
                {tOperation("maxAmount", {
                  amount: formatPrice(check.maxAmount),
                  quote,
                })}
              </Typography>
            )}
            {check.reducePnl !== undefined && (
              <Typography variant="body2">
                {tOperation("reducePnl", {
                  pnl: formatPrice(check.reducePnl),
                  quote,
                })}
              </Typography>
            )}
            {check.ok && (
              <Typography color="text.secondary" variant="caption">
                {tOperation("confirmHint")}
              </Typography>
            )}
          </Stack>
        </Alert>
      )}
    </FormBox>
  );
};

export default FuturesGridOperationDialog;
