"use client";

import { useTranslations } from "next-intl";

import { type BotForm, NumberField, SelectField } from "./fields";

import { Alert, Grid, TextField } from "@mui/material";

import { quantAiEffortValues, quantCandleIntervalValues } from "@/types/api";

interface AiFieldsProps {
  form: BotForm;
  quote: string;
}

const AiFields = ({ form, quote }: AiFieldsProps) => {
  const tAi = useTranslations("quant.bots.form.ai");
  const tQuant = useTranslations("quant");
  const guidelineError = form.formState.errors.ai?.guideline;

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Alert severity="info">{tAi("hint")}</Alert>
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <SelectField
          form={form}
          helperText={tAi("intervalHelper")}
          label={tAi("interval")}
          name="ai.interval"
          options={quantCandleIntervalValues.map((value) => ({
            label: tQuant(`intervals.${value}`),
            value,
          }))}
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <SelectField
          form={form}
          helperText={tAi("effortHelper")}
          label={tAi("effort")}
          name="ai.effort"
          options={quantAiEffortValues.map((value) => ({
            label: tAi(`efforts.${value}`),
            value,
          }))}
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          helperText={tAi("maxOrderAmountHelper")}
          label={tAi("maxOrderAmount")}
          name="ai.maxOrderAmount"
          required
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment="USD"
          form={form}
          helperText={tAi("monthlyCostLimitHelper")}
          label={tAi("monthlyCostLimit")}
          name="ai.monthlyCostLimit"
          required
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment="%"
          form={form}
          helperText={tAi("guardHelper")}
          label={tAi("takeProfit")}
          name="ai.takeProfit"
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment="%"
          form={form}
          helperText={tAi("guardHelper")}
          label={tAi("stopLoss")}
          name="ai.stopLoss"
        />
      </Grid>
      <Grid size={12}>
        <TextField
          {...form.register("ai.guideline")}
          error={!!guidelineError}
          fullWidth
          helperText={guidelineError?.message ?? tAi("guidelineHelper")}
          label={tAi("guideline")}
          minRows={3}
          multiline
          placeholder={tAi("guidelinePlaceholder")}
        />
      </Grid>
    </Grid>
  );
};

export default AiFields;
