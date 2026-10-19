"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { QUANT_BOTS_URL } from "../../useQuantBots";

import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";

import type { QuantBot, QuantBotEquityPoint } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

interface EquityChartProps {
  bot: QuantBot;
  quote: string;
}

const EquityChart = ({ bot, quote }: EquityChartProps) => {
  const tDetail = useTranslations("quant.bots.detail");
  const format = useFormatter();
  const theme = useTheme();

  const { data: points = [] } = useSWR<QuantBotEquityPoint[]>(
    `${QUANT_BOTS_URL}/${bot.id}/equity`,
    fetcher,
  );

  return (
    <Stack sx={{ gap: 1 }}>
      <Typography variant="h6">{tDetail("equityCurve")}</Typography>
      {points.length < 2 ? (
        <Typography color="text.secondary" variant="body2">
          {tDetail("equityCurveEmpty")}
        </Typography>
      ) : (
        <Box sx={{ height: 240 }}>
          <LineChart
            grid={{ horizontal: true }}
            hideLegend
            margin={{ bottom: 0, left: 0 }}
            series={[
              {
                color:
                  bot.summary.pnl >= 0
                    ? theme.vars.palette.success.main
                    : theme.vars.palette.error.main,
                curve: "linear",
                data: points.map(({ equity }) => equity),
                label: tDetail("summary.equity"),
                showMark: false,
                valueFormatter: (value) =>
                  `${format.number(value ?? 0, { maximumFractionDigits: 2 })} ${quote}`,
              },
            ]}
            xAxis={[
              {
                data: points.map(({ time }) => new Date(time)),
                scaleType: "time",
                valueFormatter: (value: Date) =>
                  format.dateTime(value, "compact"),
              },
            ]}
          />
        </Box>
      )}
    </Stack>
  );
};

export default EquityChart;
