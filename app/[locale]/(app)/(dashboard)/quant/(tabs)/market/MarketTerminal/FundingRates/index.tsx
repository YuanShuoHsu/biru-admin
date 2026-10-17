"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";

import type { QuantFundingRate } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const FUNDING_HISTORY_LIMIT = 90;
const CHART_HEIGHT = 200;

const FundingRates = ({ symbol }: { symbol: string }) => {
  const tFunding = useTranslations("quant.futures.fundingHistory");
  const format = useFormatter();
  const theme = useTheme();

  const { data: rates } = useSWR<QuantFundingRate[]>(
    `/api/quant/markets/${symbol}/funding-rates?limit=${FUNDING_HISTORY_LIMIT}`,
    fetcher,
  );

  const percent = (value: number) =>
    format.number(value, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 4,
      style: "percent",
    });
  const average = rates?.length
    ? rates.reduce((sum, { rate }) => sum + rate, 0) / rates.length
    : null;

  return (
    <Stack sx={{ gap: 1 }}>
      <Stack
        sx={{
          alignItems: "baseline",
          flexDirection: "row",
          gap: 2,
          justifyContent: "space-between",
        }}
      >
        <Typography variant="subtitle1">{tFunding("title")}</Typography>
        {average !== null && (
          <Typography color="text.secondary" variant="body2">
            {tFunding("average", { rate: percent(average) })}
          </Typography>
        )}
      </Stack>
      {rates ? (
        <Box sx={{ height: CHART_HEIGHT }}>
          <BarChart
            dataset={rates.map(({ rate, time }) => ({ rate, time }))}
            hideLegend
            margin={{ bottom: 0, left: 0 }}
            series={[
              {
                dataKey: "rate",
                label: tFunding("rate"),
                valueFormatter: (value) =>
                  value === null ? "—" : percent(value),
              },
            ]}
            xAxis={[
              {
                dataKey: "time",
                scaleType: "band",
                tickLabelInterval: (_, index) => index % 15 === 0,
                valueFormatter: (value: number) =>
                  format.dateTime(new Date(value), "monthDay"),
              },
            ]}
            yAxis={[
              {
                colorMap: {
                  colors: [
                    theme.vars.palette.error.main,
                    theme.vars.palette.success.main,
                  ],
                  thresholds: [0],
                  type: "piecewise",
                },
                valueFormatter: (value: number) => percent(value),
                width: 72,
              },
            ]}
          />
        </Box>
      ) : (
        <Skeleton height={CHART_HEIGHT} variant="rounded" />
      )}
      <Typography color="text.secondary" variant="caption">
        {tFunding("note")}
      </Typography>
    </Stack>
  );
};

export default FundingRates;
