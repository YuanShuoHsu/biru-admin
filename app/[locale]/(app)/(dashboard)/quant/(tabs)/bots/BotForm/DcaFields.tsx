"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useWatch } from "react-hook-form";

import { type BotFormValues, dcaMaxInvestment } from "./definitions";
import { type BotForm, NumberField } from "./fields";

import { Grid, Typography } from "@mui/material";

interface DcaFieldsProps {
  form: BotForm;
  quote: string;
}

const DcaFields = ({ form, quote }: DcaFieldsProps) => {
  const tDca = useTranslations("quant.bots.form.dca");
  const format = useFormatter();

  const dca = useWatch({ control: form.control, name: "dca" });
  const required = dcaMaxInvestment({ dca } as BotFormValues);

  return (
    <Grid container spacing={2}>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          label={tDca("baseOrderAmount")}
          name="dca.baseOrderAmount"
          required
        />
      </Grid>
      <Grid size={{ sm: 6, xs: 12 }}>
        <NumberField
          adornment={quote}
          form={form}
          label={tDca("safetyOrderAmount")}
          name="dca.safetyOrderAmount"
          required
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <NumberField
          form={form}
          label={tDca("maxSafetyOrders")}
          name="dca.maxSafetyOrders"
          required
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <NumberField
          adornment="%"
          form={form}
          label={tDca("priceDeviation")}
          name="dca.priceDeviation"
          required
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <NumberField
          adornment="×"
          form={form}
          label={tDca("stepScale")}
          name="dca.stepScale"
          required
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <NumberField
          adornment="×"
          form={form}
          label={tDca("volumeScale")}
          name="dca.volumeScale"
          required
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <NumberField
          adornment="%"
          form={form}
          label={tDca("takeProfit")}
          name="dca.takeProfit"
          required
        />
      </Grid>
      <Grid size={{ sm: 4, xs: 12 }}>
        <NumberField
          adornment="%"
          form={form}
          label={tDca("stopLoss")}
          name="dca.stopLoss"
        />
      </Grid>
      {required !== null && required > 0 && (
        <Grid size={12}>
          <Typography color="text.secondary" variant="body2">
            {tDca("maxInvestment", {
              amount: format.number(required, { maximumFractionDigits: 2 }),
              quote,
            })}
          </Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default DcaFields;
