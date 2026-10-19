"use client";

import { useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useWatch } from "react-hook-form";

import { futuresGridConfig } from "./definitions";
import { type BotForm, NumberField, SelectField } from "./fields";
import GridFields from "./GridFields";

import { Calculate } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { quantFuturesGridTrendValues } from "@/types/api";
import type {
  FuturesGridCheckDto,
  FuturesGridCheckResult,
  QuantMarket,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface FuturesGridFieldsProps {
  checkCredentialId?: string;
  form: BotForm;
  lastPrice?: number;
  market?: QuantMarket;
}

const FuturesGridFields = ({
  checkCredentialId,
  form,
  lastPrice,
  market,
}: FuturesGridFieldsProps) => {
  const tFutures = useTranslations("quant.bots.form.futuresGrid");
  const format = useFormatter();

  const [check, setCheck] = useState<FuturesGridCheckResult | null>(null);
  const [checking, setChecking] = useState(false);

  const [trend, lossStopType] = useWatch({
    control: form.control,
    name: ["futuresGrid.trend", "grid.lossStopType"],
  });

  const quote = market?.quoteCurrency ?? "";
  const formatPrice = (value: number) =>
    format.number(value, {
      maximumFractionDigits: market?.pricePrecision ?? 2,
    });
  const distance = (price: number) =>
    lastPrice
      ? format.number(Math.abs(lastPrice - price) / lastPrice, {
          maximumFractionDigits: 2,
          style: "percent",
        })
      : "—";

  const runCheck = async () => {
    if (!checkCredentialId || !market) return;
    if (!(await form.trigger(["grid", "futuresGrid", "investment"]))) return;

    const values = form.getValues();
    setChecking(true);
    try {
      setCheck(
        await fetcher<FuturesGridCheckResult>(
          "/api/quant/bots/futures_grid/check",
          {
            body: JSON.stringify({
              config: futuresGridConfig(values),
              credentialId: checkCredentialId,
              investment: Number(values.investment),
              symbol: values.symbol,
            } satisfies FuturesGridCheckDto),
            headers: { "Content-Type": "application/json" },
            method: "POST",
          },
        ),
      );
    } catch (error) {
      setCheck(null);
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ sm: 6, xs: 12 }}>
          <SelectField
            form={form}
            label={tFutures("trend")}
            name="futuresGrid.trend"
            options={quantFuturesGridTrendValues.map((value) => ({
              label: tFutures(`trends.${value}`),
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
            name="futuresGrid.leverage"
            required
          />
        </Grid>
        <Grid size={12}>
          <NumberField
            adornment={quote}
            form={form}
            helperText={tFutures("extraMarginHelper")}
            label={tFutures("extraMargin")}
            name="futuresGrid.extraMargin"
          />
        </Grid>
      </Grid>
      <GridFields
        form={form}
        market={market}
        stopHelpers={{
          loss: tFutures(`lossStopHelper.${trend}`),
          profit: tFutures(`profitStopHelper.${trend}`),
        }}
      />
      {trend === "no_trend" && (
        <NumberField
          adornment={quote}
          form={form}
          helperText={tFutures("lossStopHighHelper")}
          label={tFutures("lossStopHigh")}
          name="futuresGrid.lossStopHigh"
        />
      )}
      {trend === "no_trend" && lossStopType === "price_limit" && (
        <NumberField
          adornment={quote}
          form={form}
          helperText={tFutures("lossStopLimitHighHelper")}
          label={tFutures("lossStopLimitHigh")}
          name="futuresGrid.lossStopLimitHigh"
        />
      )}
      <Box>
        <Tooltip
          title={checkCredentialId ? "" : tFutures("checkNeedsCredential")}
        >
          <Box component="span">
            <Button
              disabled={!checkCredentialId || !market}
              loading={checking}
              onClick={runCheck}
              startIcon={<Calculate />}
              variant="outlined"
            >
              {tFutures("check")}
            </Button>
          </Box>
        </Tooltip>
      </Box>
      {check && (
        <Alert severity="info">
          <Stack sx={{ gap: 0.5 }}>
            {check.minInvestment !== undefined && (
              <Typography variant="body2">
                {tFutures("checkInvestment", {
                  max:
                    check.maxInvestment === undefined
                      ? "—"
                      : formatPrice(check.maxInvestment),
                  min: formatPrice(check.minInvestment),
                  quote,
                })}
              </Typography>
            )}
            {check.perVolume !== undefined && (
              <Typography variant="body2">
                {tFutures("checkPerVolume", {
                  base: market?.baseCurrency ?? "",
                  volume: format.number(check.perVolume, {
                    maximumFractionDigits: market?.sizePrecision ?? 8,
                  }),
                })}
              </Typography>
            )}
            {check.liquidationPriceDown !== undefined && (
              <Typography variant="body2">
                {tFutures("checkLiquidationDown", {
                  distance: distance(check.liquidationPriceDown),
                  price: formatPrice(check.liquidationPriceDown),
                })}
              </Typography>
            )}
            {check.liquidationPriceUp !== undefined && (
              <Typography variant="body2">
                {tFutures("checkLiquidationUp", {
                  distance: distance(check.liquidationPriceUp),
                  price: formatPrice(check.liquidationPriceUp),
                })}
              </Typography>
            )}
            <Typography color="text.secondary" variant="caption">
              {tFutures("checkNote")}
            </Typography>
          </Stack>
        </Alert>
      )}
    </Stack>
  );
};

export default FuturesGridFields;
