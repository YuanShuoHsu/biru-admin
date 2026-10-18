"use client";

import { useTranslations } from "next-intl";
import { useWatch } from "react-hook-form";

import { type BotForm, NumberField } from "./fields";

import { Alert, Checkbox, FormControlLabel, Grid } from "@mui/material";

import type { QuantMarket } from "@/types/quant";

interface SignalFieldsProps {
  form: BotForm;
  market?: QuantMarket;
}

const SignalFields = ({ form, market }: SignalFieldsProps) => {
  const tSignal = useTranslations("quant.bots.form.signal");
  const compound = useWatch({ control: form.control, name: "signal.compound" });

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Alert severity="info">{tSignal("hint")}</Alert>
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment="x"
          form={form}
          helperText={
            market?.perp &&
            tSignal("leverageMax", { max: market.perp.maxLeverage })
          }
          label={tSignal("leverage")}
          name="signal.leverage"
          required
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={compound}
              onChange={(event) =>
                form.setValue("signal.compound", event.target.checked)
              }
            />
          }
          label={tSignal("compound")}
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment="%"
          form={form}
          helperText={tSignal("takeProfitHelper")}
          label={tSignal("takeProfit")}
          name="signal.takeProfit"
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment="%"
          form={form}
          helperText={tSignal("stopLossHelper")}
          label={tSignal("stopLoss")}
          name="signal.stopLoss"
        />
      </Grid>
    </Grid>
  );
};

export default SignalFields;
