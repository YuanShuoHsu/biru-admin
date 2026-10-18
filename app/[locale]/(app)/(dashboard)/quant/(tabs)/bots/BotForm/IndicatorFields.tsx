"use client";

import { useTranslations } from "next-intl";
import { useFieldArray, useWatch } from "react-hook-form";

import { emptyCondition } from "./definitions";
import { type BotForm, NumberField, SelectField } from "./fields";

import { Add, Delete } from "@mui/icons-material";
import {
  Button,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  quantBollingerBandValues,
  quantCandleIntervalValues,
  quantConditionOperatorValues,
  quantCrossDirectionValues,
  quantIndicatorKindValues,
} from "@/types/api";
import type { QuantIndicatorKind } from "@/types/quant";

const MAX_CONDITIONS = 5;

interface ConditionRowProps {
  form: BotForm;
  group: "entry" | "exit";
  index: number;
  onRemove?: () => void;
}

const ConditionRow = ({ form, group, index, onRemove }: ConditionRowProps) => {
  const tIndicator = useTranslations("quant.bots.form.indicator");
  const path = `indicator.${group}.${index}` as const;

  const kind = useWatch({ control: form.control, name: `${path}.kind` });

  return (
    <Paper sx={{ p: 1.5 }} variant="outlined">
      <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
        <Grid size={{ sm: 4, xs: 12 }}>
          <TextField
            fullWidth
            label={tIndicator("kind")}
            onChange={(event) =>
              form.setValue(
                path,
                emptyCondition(group, event.target.value as QuantIndicatorKind),
              )
            }
            select
            size="small"
            value={kind}
          >
            {quantIndicatorKindValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tIndicator(`kinds.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {kind === "rsi" && (
          <>
            <Grid size={{ sm: 2, xs: 4 }}>
              <NumberField
                form={form}
                label={tIndicator("period")}
                name={`${path}.period`}
              />
            </Grid>
            <Grid size={{ sm: 3, xs: 4 }}>
              <SelectField
                form={form}
                label={tIndicator("comparison")}
                name={`${path}.operator`}
                options={quantConditionOperatorValues.map((value) => ({
                  label: tIndicator(`operator.${value}`),
                  value,
                }))}
              />
            </Grid>
            <Grid size={{ sm: 2, xs: 4 }}>
              <NumberField
                form={form}
                label={tIndicator("value")}
                name={`${path}.value`}
              />
            </Grid>
          </>
        )}
        {(kind === "maCross" ||
          kind === "emaCross" ||
          kind === "macdCross") && (
          <>
            <Grid size={{ sm: 2, xs: 4 }}>
              <NumberField
                form={form}
                label={tIndicator("fast")}
                name={`${path}.fast`}
              />
            </Grid>
            <Grid size={{ sm: 2, xs: 4 }}>
              <NumberField
                form={form}
                label={tIndicator("slow")}
                name={`${path}.slow`}
              />
            </Grid>
            {kind === "macdCross" && (
              <Grid size={{ sm: 1, xs: 4 }}>
                <NumberField
                  form={form}
                  label={tIndicator("period")}
                  name={`${path}.period`}
                />
              </Grid>
            )}
            <Grid size={{ sm: kind === "macdCross" ? 2 : 3, xs: 12 }}>
              <SelectField
                form={form}
                label={tIndicator("cross")}
                name={`${path}.direction`}
                options={quantCrossDirectionValues.map((value) => ({
                  label: tIndicator(`direction.${value}`),
                  value,
                }))}
              />
            </Grid>
          </>
        )}
        {kind === "bollinger" && (
          <>
            <Grid size={{ sm: 2, xs: 4 }}>
              <NumberField
                form={form}
                label={tIndicator("period")}
                name={`${path}.period`}
              />
            </Grid>
            <Grid size={{ sm: 2, xs: 4 }}>
              <NumberField
                form={form}
                label={tIndicator("stdDev")}
                name={`${path}.stdDev`}
              />
            </Grid>
            <Grid size={{ sm: 3, xs: 4 }}>
              <SelectField
                form={form}
                label={tIndicator("bandCondition")}
                name={`${path}.band`}
                options={quantBollingerBandValues.map((value) => ({
                  label: tIndicator(`band.${value}`),
                  value,
                }))}
              />
            </Grid>
          </>
        )}
        {onRemove && (
          <Grid size="auto" sx={{ ml: "auto" }}>
            <Tooltip title={tIndicator("removeCondition")}>
              <IconButton onClick={onRemove} size="small">
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

const ConditionGroup = ({
  form,
  group,
}: {
  form: BotForm;
  group: "entry" | "exit";
}) => {
  const tIndicator = useTranslations("quant.bots.form.indicator");
  const { append, fields, remove } = useFieldArray({
    control: form.control,
    name: `indicator.${group}`,
  });
  const minimum = group === "entry" ? 1 : 0;

  return (
    <Stack sx={{ gap: 1 }}>
      <Typography variant="subtitle2">{tIndicator(group)}</Typography>
      {fields.map((field, index) => (
        <ConditionRow
          form={form}
          group={group}
          index={index}
          key={field.id}
          onRemove={fields.length > minimum ? () => remove(index) : undefined}
        />
      ))}
      {fields.length < MAX_CONDITIONS && (
        <Button
          onClick={() => append(emptyCondition(group))}
          size="small"
          startIcon={<Add />}
          sx={{ alignSelf: "flex-start" }}
        >
          {tIndicator("addCondition")}
        </Button>
      )}
    </Stack>
  );
};

interface IndicatorFieldsProps {
  form: BotForm;
  quote: string;
}

const IndicatorFields = ({ form, quote }: IndicatorFieldsProps) => {
  const tIndicator = useTranslations("quant.bots.form.indicator");
  const tQuant = useTranslations("quant");

  return (
    <Stack sx={{ gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ sm: 6, xs: 12 }}>
          <SelectField
            form={form}
            label={tIndicator("interval")}
            name="indicator.interval"
            options={quantCandleIntervalValues.map((value) => ({
              label: tQuant(`intervals.${value}`),
              value,
            }))}
          />
        </Grid>
        <Grid size={{ sm: 6, xs: 12 }}>
          <NumberField
            adornment={quote}
            form={form}
            label={tIndicator("orderAmount")}
            name="indicator.orderAmount"
            required
          />
        </Grid>
        <Grid size={{ sm: 6, xs: 12 }}>
          <NumberField
            adornment="%"
            form={form}
            label={tIndicator("takeProfit")}
            name="indicator.takeProfit"
          />
        </Grid>
        <Grid size={{ sm: 6, xs: 12 }}>
          <NumberField
            adornment="%"
            form={form}
            label={tIndicator("stopLoss")}
            name="indicator.stopLoss"
          />
        </Grid>
      </Grid>
      <ConditionGroup form={form} group="entry" />
      <ConditionGroup form={form} group="exit" />
    </Stack>
  );
};

export default IndicatorFields;
