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

import {
  Alert,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  quantFuturesGridPauseModeValues,
  quantFuturesGridStopTypeValues,
} from "@/types/api";
import type {
  FuturesGridConfig,
  FuturesGridOperationCheck,
  FuturesGridOperationDto,
  FuturesGridStopType,
  QuantBot,
  QuantMarket,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const FUTURES_GRID_OPERATION_FORM_ID = "quant-futures-grid-operation";

export type FuturesGridOperation = FuturesGridOperationDto["operation"];

interface Fields {
  amount: string;
  bottom: string;
  lossStop: string;
  lossStopHigh: string;
  lossStopLimit: string;
  lossStopLimitHigh: string;
  lossStopType: FuturesGridStopType;
  pauseMode: "conditional" | "immediate";
  profitStop: string;
  profitStopLimit: string;
  profitStopType: FuturesGridStopType;
  reduceNum: string;
  row: string;
  stopLossEnabled: boolean;
  stopProfitEnabled: boolean;
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
    case "reinvest":
      return { operation };
    case "reduce":
      return { operation, reduceNum: optional(fields.reduceNum) };
    case "pause":
      return {
        operation,
        pauseMode: fields.pauseMode,
        stopLossEnabled: fields.stopLossEnabled,
        stopProfitEnabled: fields.stopProfitEnabled,
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
      const stop = (type: FuturesGridStopType, value: string, limit: string) =>
        value.trim() === ""
          ? null
          : {
              limitPrice: type === "price_limit" ? optional(limit) : undefined,
              type,
              value: Number(value),
            };

      return {
        lossStop: stop(
          fields.lossStopType,
          fields.lossStop,
          fields.lossStopLimit,
        ),
        lossStopHigh: optional(fields.lossStopHigh) ?? null,
        lossStopLimitHigh:
          fields.lossStopType === "price_limit"
            ? (optional(fields.lossStopLimitHigh) ?? null)
            : null,
        operation,
        profitStop: stop(
          fields.profitStopType,
          fields.profitStop,
          fields.profitStopLimit,
        ),
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
    lossStopLimit: text(config.lossStop?.limitPrice),
    lossStopLimitHigh: text(config.lossStopLimitHigh),
    lossStopType: config.lossStop?.type ?? "price",
    pauseMode: "immediate",
    profitStop: text(config.profitStop?.value),
    profitStopLimit: text(config.profitStop?.limitPrice),
    profitStopType: config.profitStop?.type ?? "price",
    reduceNum: "",
    row: text(config.row),
    stopLossEnabled: !!config.lossStop,
    stopProfitEnabled: !!config.profitStop,
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

  const describeStop = (stop?: FuturesGridConfig["lossStop"]) => {
    if (!stop) return tOperation("stopNotSet");

    const value =
      stop.type === "profit_ratio"
        ? `${stop.value}%`
        : `${formatPrice(stop.value)} ${quote}`;
    return `${tGrid(`stopType.${stop.type}`)} ${value}`;
  };

  const pauseStopSwitch = (name: "stopLossEnabled" | "stopProfitEnabled") => (
    <Stack>
      <FormControlLabel
        control={
          <Switch
            checked={fields[name]}
            onChange={(event) =>
              setFields((current) => ({
                ...current,
                [name]: event.target.checked,
              }))
            }
          />
        }
        label={tOperation(name)}
      />
      <Typography color="text.secondary" variant="caption">
        {describeStop(
          name === "stopLossEnabled" ? config.lossStop : config.profitStop,
        )}
      </Typography>
    </Stack>
  );

  const stopTypeField = (name: "lossStopType" | "profitStopType") => (
    <TextField
      label={tGrid(name)}
      onChange={(event) =>
        update({ [name]: event.target.value as FuturesGridStopType })
      }
      select
      sx={{ minWidth: 120 }}
      value={fields[name]}
    >
      {quantFuturesGridStopTypeValues.map((value) => (
        <MenuItem key={value} value={value}>
          {tGrid(`stopType.${value}`)}
        </MenuItem>
      ))}
    </TextField>
  );

  return (
    <>
      <CustomizedDialogContent>
        <FormBox
          id={FUTURES_GRID_OPERATION_FORM_ID}
          noValidate
          onSubmit={onSubmit}
        >
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
          {operation === "pause" && (
            <>
              {pauseStopSwitch("stopProfitEnabled")}
              {pauseStopSwitch("stopLossEnabled")}
            </>
          )}
          {operation === "stops" && (
            <>
              <Stack sx={{ flexDirection: "row", gap: 2 }}>
                {stopTypeField("lossStopType")}
                {numberField(
                  "lossStop",
                  tGrid("lossStop"),
                  fields.lossStopType === "profit_ratio" ? "%" : quote,
                  tOperation("stopClearHelper"),
                )}
              </Stack>
              {fields.lossStopType === "price_limit" &&
                numberField(
                  "lossStopLimit",
                  tGrid("lossStopLimit"),
                  quote,
                  tGrid("stopLimitHelper"),
                )}
              {config.trend === "no_trend" &&
                numberField(
                  "lossStopHigh",
                  tOperation("lossStopHigh"),
                  quote,
                  tOperation("stopClearHelper"),
                )}
              {config.trend === "no_trend" &&
                fields.lossStopType === "price_limit" &&
                numberField(
                  "lossStopLimitHigh",
                  tOperation("lossStopLimitHigh"),
                  quote,
                  tGrid("stopLimitHelper"),
                )}
              <Stack sx={{ flexDirection: "row", gap: 2 }}>
                {stopTypeField("profitStopType")}
                {numberField(
                  "profitStop",
                  tGrid("profitStop"),
                  fields.profitStopType === "profit_ratio" ? "%" : quote,
                  tOperation("stopClearHelper"),
                )}
              </Stack>
              {fields.profitStopType === "price_limit" &&
                numberField(
                  "profitStopLimit",
                  tGrid("profitStopLimit"),
                  quote,
                  tGrid("stopLimitHelper"),
                )}
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
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default FuturesGridOperationDialog;
