import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import { DASHBOARD_RANGES, type DashboardRange } from "./definitions";

import { PLATFORM_TIMEZONE, STORE_TIMEZONE } from "@/constants/timezone";

import { useTheme } from "@mui/material/styles";

const TREND_NEUTRAL_THRESHOLD = 5;

export const AXIS_TICK_NUMBER = 5;

export const useDashboardCharts = (range: DashboardRange) => {
  const format = useFormatter();

  const theme = useTheme();

  const tDashboard = useTranslations("dashboard");

  const formatTick = (value: number) => format.number(value);

  const moneyAxis = {
    tickNumber: AXIS_TICK_NUMBER,
    valueFormatter: formatTick,
    width: "auto",
  } as const;

  const countAxis = { tickMinStep: 1, valueFormatter: formatTick } as const;

  const getTrendColors = (percent: number) => {
    const chipColor =
      percent > TREND_NEUTRAL_THRESHOLD
        ? "success"
        : percent < -TREND_NEUTRAL_THRESHOLD
          ? "error"
          : "default";
    const trendColor =
      chipColor === "default"
        ? theme.vars.palette.text.secondary
        : theme.vars.palette[chipColor].main;

    return { chipColor, trendColor } as const;
  };

  return {
    chartColor: theme.vars.palette.primary.main,
    countAxis,
    getTrendColors,
    moneyAxis,
    periodLabel: tDashboard(`stats.period.${range}`),
    tickStep: DASHBOARD_RANGES[range].tickStep,
    warningColor: theme.vars.palette.warning.main,
  };
};

export const useTrendLabels = (
  trendStarts: string[],
  range: DashboardRange,
) => {
  const format = useFormatter();

  const bucketUnit = DASHBOARD_RANGES[range].bucketUnit;

  return useMemo(
    () =>
      trendStarts.map((start) =>
        bucketUnit === "month"
          ? format.dateTime(new Date(start), {
              year: "numeric",
              month: "2-digit",
              timeZone: PLATFORM_TIMEZONE,
            })
          : format.dateTime(
              new Date(start),
              bucketUnit === "hour" ? "time" : "monthDay",
              { timeZone: STORE_TIMEZONE },
            ),
      ),
    [bucketUnit, format, trendStarts],
  );
};
