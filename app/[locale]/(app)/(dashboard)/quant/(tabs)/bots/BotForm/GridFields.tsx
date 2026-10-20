"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useWatch } from "react-hook-form";

import { spotGridConfig } from "./definitions";
import { type BotForm, NumberField, SelectField } from "./fields";

import { AutoAwesome, Calculate } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  quantGridCloseModelValues,
  quantFuturesGridStopTypeValues,
  quantGridStopTypeValues,
  quantGridTypeValues,
  quantTriggerDirectionValues,
} from "@/types/api";
import type {
  GridAiStrategy,
  GridCheckDto,
  GridCheckResult,
  QuantMarket,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface GridFieldsProps {
  credentialId?: string;
  form: BotForm;
  market?: QuantMarket;
  /** 合約網格：沒有 AI 推薦、試算與平倉方式，停損停利的方向依多空而定 */
  stopHelpers?: { loss: string; profit: string };
}

const GridFields = ({
  credentialId,
  form,
  market,
  stopHelpers,
}: GridFieldsProps) => {
  const tGrid = useTranslations("quant.bots.form.grid");
  const format = useFormatter();

  const [suggestion, setSuggestion] = useState<GridAiStrategy | null>(null);
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState<GridCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const symbol = useWatch({ control: form.control, name: "symbol" });
  const [lossStopType, profitStopType] = useWatch({
    control: form.control,
    name: ["grid.lossStopType", "grid.profitStopType"],
  });
  const [top, bottom, row, gridType, mode] = useWatch({
    control: form.control,
    name: ["grid.top", "grid.bottom", "grid.row", "grid.gridType", "mode"],
  });

  const quote = market?.quoteCurrency ?? "";
  const percent = (value: number) =>
    format.number(value, { maximumFractionDigits: 2, style: "percent" });

  const formatQuote = (value: number) =>
    format.number(value, {
      maximumFractionDigits: market?.pricePrecision ?? 2,
    });

  const runCheck = async () => {
    if (!credentialId || !market) return;
    if (!(await form.trigger(["grid", "investment"]))) return;

    const values = form.getValues();
    setChecking(true);
    try {
      setCheck(
        await fetcher<GridCheckResult>("/api/quant/bots/grid/check", {
          body: JSON.stringify({
            config: spotGridConfig(values),
            credentialId,
            investment: Number(values.investment),
            symbol: values.symbol,
          } satisfies GridCheckDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
    } catch (error) {
      setCheck(null);
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setChecking(false);
    }
  };

  const applySuggestion = async () => {
    if (!credentialId || !market) return;

    setLoading(true);
    try {
      const strategy = await fetcher<GridAiStrategy>(
        `/api/quant/credentials/${credentialId}/grid-ai-strategy?symbol=${symbol}`,
      );
      const options = { shouldValidate: form.formState.isSubmitted };
      form.setValue(
        "grid.top",
        strategy.top.toFixed(market.pricePrecision),
        options,
      );
      form.setValue(
        "grid.bottom",
        strategy.bottom.toFixed(market.pricePrecision),
        options,
      );
      form.setValue("grid.row", String(strategy.row), options);
      setSuggestion(strategy);
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const isFutures = !!stopHelpers;

  const profitPerGrid = (() => {
    const [high, low, rows] = [Number(top), Number(bottom), Number(row)];
    if (!(low > 0 && high > low && Number.isInteger(rows) && rows >= 2))
      return undefined;
    if (gridType === "geometric")
      return tGrid("profitPerGridFixed", {
        value: percent((high / low) ** (1 / rows) - 1),
      });

    const step = (high - low) / rows;
    return tGrid("profitPerGrid", {
      max: percent(step / low),
      min: percent(step / (high - step)),
    });
  })();
  const stopTypeOptions = (
    isFutures ? quantFuturesGridStopTypeValues : quantGridStopTypeValues
  ).map((value) => ({ label: tGrid(`stopType.${value}`), value }));

  return (
    <Grid container spacing={2}>
      {!isFutures && (
        <Grid size={12}>
          <Tooltip
            title={credentialId ? "" : tGrid("aiStrategyNeedsCredential")}
          >
            <Box component="span">
              <Button
                disabled={!credentialId || !market}
                loading={loading}
                onClick={applySuggestion}
                startIcon={<AutoAwesome />}
                variant="outlined"
              >
                {tGrid("aiStrategy")}
              </Button>
            </Box>
          </Tooltip>
        </Grid>
      )}
      {suggestion && (
        <Grid size={12}>
          <Alert severity="info">
            {tGrid("aiStrategyApplied", {
              annualized: percent(suggestion.annualized),
              drawdown: percent(suggestion.maxDrawdown),
            })}
          </Alert>
        </Grid>
      )}
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          label={tGrid("top")}
          name="grid.top"
          required
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          label={tGrid("bottom")}
          name="grid.bottom"
          required
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          form={form}
          helperText={isFutures ? undefined : profitPerGrid}
          label={tGrid("row")}
          name="grid.row"
          required
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <SelectField
          form={form}
          label={tGrid("gridType.label")}
          name="grid.gridType"
          options={quantGridTypeValues.map((value) => ({
            label: tGrid(`gridType.${value}`),
            value,
          }))}
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <SelectField
          form={form}
          label={tGrid("lossStopType")}
          name="grid.lossStopType"
          options={stopTypeOptions}
        />
      </Grid>
      <Grid size={{ sm: lossStopType === "price_limit" ? 4 : 8, xs: 12 }}>
        <NumberField
          adornment={lossStopType === "profit_ratio" ? "%" : quote}
          form={form}
          helperText={stopHelpers?.loss}
          label={tGrid("lossStop")}
          name="grid.lossStop"
        />
      </Grid>
      {lossStopType === "price_limit" && (
        <Grid size={{ sm: 4, xs: 12 }}>
          <NumberField
            adornment={quote}
            form={form}
            helperText={tGrid("stopLimitHelper")}
            label={tGrid("lossStopLimit")}
            name="grid.lossStopLimit"
          />
        </Grid>
      )}
      <Grid size={{ sm: 4, xs: 12 }}>
        <SelectField
          form={form}
          label={tGrid("profitStopType")}
          name="grid.profitStopType"
          options={stopTypeOptions}
        />
      </Grid>
      <Grid size={{ sm: profitStopType === "price_limit" ? 4 : 8, xs: 12 }}>
        <NumberField
          adornment={profitStopType === "profit_ratio" ? "%" : quote}
          form={form}
          helperText={stopHelpers?.profit}
          label={tGrid("profitStop")}
          name="grid.profitStop"
        />
      </Grid>
      {profitStopType === "price_limit" && (
        <Grid size={{ sm: 4, xs: 12 }}>
          <NumberField
            adornment={quote}
            form={form}
            helperText={tGrid("stopLimitHelper")}
            label={tGrid("profitStopLimit")}
            name="grid.profitStopLimit"
          />
        </Grid>
      )}
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          label={tGrid("trigger")}
          name="grid.triggerPrice"
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <SelectField
          form={form}
          label={tGrid("triggerDirection.label")}
          name="grid.triggerDirection"
          options={quantTriggerDirectionValues.map((value) => ({
            label: tGrid(`triggerDirection.${value}`),
            value,
          }))}
        />
      </Grid>
      {!isFutures && mode === "live" && (
        <Grid size={12}>
          <NumberField
            adornment="%"
            form={form}
            helperText={tGrid("slippageHelper")}
            label={tGrid("slippage")}
            name="grid.slippage"
          />
        </Grid>
      )}
      {!isFutures && (
        <Grid size={12}>
          <SelectField
            form={form}
            label={tGrid("closeModel.label")}
            name="grid.closeModel"
            options={quantGridCloseModelValues.map((value) => ({
              label: tGrid(`closeModel.${value}`, { quote }),
              value,
            }))}
          />
        </Grid>
      )}
      {!isFutures && (
        <Grid size={12}>
          <Tooltip title={credentialId ? "" : tGrid("checkNeedsCredential")}>
            <Box component="span">
              <Button
                disabled={!credentialId || !market}
                loading={checking}
                onClick={runCheck}
                startIcon={<Calculate />}
                variant="outlined"
              >
                {tGrid("check")}
              </Button>
            </Box>
          </Tooltip>
        </Grid>
      )}
      {check && (
        <Grid size={12}>
          <Alert severity="info">
            <Stack sx={{ gap: 0.5 }}>
              {check.minInvestment !== undefined && (
                <Typography variant="body2">
                  {tGrid("checkInvestment", {
                    max:
                      check.maxInvestment === undefined
                        ? "—"
                        : formatQuote(check.maxInvestment),
                    min: formatQuote(check.minInvestment),
                    quote,
                  })}
                </Typography>
              )}
              {check.perVolume !== undefined && (
                <Typography variant="body2">
                  {tGrid("checkPerVolume", {
                    base: market?.baseCurrency ?? "",
                    volume: format.number(check.perVolume, {
                      maximumFractionDigits: market?.sizePrecision ?? 8,
                    }),
                  })}
                </Typography>
              )}
              {check.fee !== undefined && (
                <Typography variant="body2">
                  {tGrid("checkFee", { fee: formatQuote(check.fee), quote })}
                </Typography>
              )}
              <Typography color="text.secondary" variant="caption">
                {tGrid("checkNote")}
              </Typography>
            </Stack>
          </Alert>
        </Grid>
      )}
    </Grid>
  );
};

export default GridFields;
