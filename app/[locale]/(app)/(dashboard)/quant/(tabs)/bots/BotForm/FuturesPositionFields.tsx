"use client";

import { useTranslations } from "next-intl";

import { type BotForm, NumberField, SelectField } from "./fields";

import { Alert, Grid } from "@mui/material";

import { quantFuturesDirectionValues } from "@/types/api";
import type { QuantMarket } from "@/types/quant";

interface FuturesPositionFieldsProps {
  form: BotForm;
  market?: QuantMarket;
}

const FuturesPositionFields = ({
  form,
  market,
}: FuturesPositionFieldsProps) => {
  const tFutures = useTranslations("quant.bots.form.futures");

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Alert severity="info">{tFutures("hint")}</Alert>
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <SelectField
          form={form}
          label={tFutures("direction")}
          name="futures.direction"
          options={quantFuturesDirectionValues.map((value) => ({
            label: tFutures(`directions.${value}`),
            value,
          }))}
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment="x"
          form={form}
          helperText={
            market?.perp &&
            tFutures("leverageMax", { max: market.perp.maxLeverage })
          }
          label={tFutures("leverage")}
          name="futures.leverage"
          required
        />
      </Grid>
    </Grid>
  );
};

export default FuturesPositionFields;
