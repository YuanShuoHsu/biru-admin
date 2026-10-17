"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useWatch } from "react-hook-form";

import { type BotForm, NumberField, SelectField } from "./fields";

import { AutoAwesome } from "@mui/icons-material";
import { Alert, Box, Button, Grid, Tooltip } from "@mui/material";

import {
  quantGridCloseModelValues,
  quantGridStopTypeValues,
  quantGridTypeValues,
  quantTriggerDirectionValues,
} from "@/types/api";
import type { GridAiStrategy, QuantMarket } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface GridFieldsProps {
  aiCredentialId?: string;
  form: BotForm;
  market?: QuantMarket;
}

const GridFields = ({ aiCredentialId, form, market }: GridFieldsProps) => {
  const tGrid = useTranslations("quant.bots.form.grid");
  const format = useFormatter();

  const [suggestion, setSuggestion] = useState<GridAiStrategy | null>(null);
  const [loading, setLoading] = useState(false);

  const symbol = useWatch({ control: form.control, name: "symbol" });

  const quote = market?.quoteCurrency ?? "";
  const percent = (value: number) =>
    format.number(value, { maximumFractionDigits: 2, style: "percent" });

  const applySuggestion = async () => {
    if (!aiCredentialId || !market) return;

    setLoading(true);
    try {
      const strategy = await fetcher<GridAiStrategy>(
        `/api/quant/credentials/${aiCredentialId}/grid-ai-strategy?symbol=${symbol}`,
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

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Tooltip
          title={aiCredentialId ? "" : tGrid("aiStrategyNeedsCredential")}
        >
          <Box component="span">
            <Button
              disabled={!aiCredentialId || !market}
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
          label={tGrid("lossStop")}
          name="grid.lossStopType"
          options={quantGridStopTypeValues.map((value) => ({
            label: tGrid(`stopType.${value}`),
            value,
          }))}
        />
      </Grid>
      <Grid size={{ sm: 8, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          label={tGrid("lossStop")}
          name="grid.lossStop"
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <SelectField
          form={form}
          label={tGrid("profitStop")}
          name="grid.profitStopType"
          options={quantGridStopTypeValues.map((value) => ({
            label: tGrid(`stopType.${value}`),
            value,
          }))}
        />
      </Grid>
      <Grid size={{ sm: 8, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          label={tGrid("profitStop")}
          name="grid.profitStop"
        />
      </Grid>
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
          label={tGrid("trigger")}
          name="grid.triggerDirection"
          options={quantTriggerDirectionValues.map((value) => ({
            label: tGrid(`triggerDirection.${value}`),
            value,
          }))}
        />
      </Grid>
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
    </Grid>
  );
};

export default GridFields;
