"use client";

import { useTranslations } from "next-intl";

import AreaGradient from "../AreaGradient";
import ChartCard from "../ChartCard";
import type { DashboardRange } from "../definitions";
import { StyledBarChart } from "../styled";
import { useDashboardCharts } from "../useDashboardCharts";

import { Grid, Typography } from "@mui/material";

import {
  servingTemperatureLevelValues,
  sweetnessLevelValues,
} from "@/types/api";
import type { OrderStatsResponse } from "@/types/orders";

import { emptyWhenAllZero } from "@/utils/dashboard";

export interface MenuItemSales {
  name: string;
  quantity: number;
}

interface MenusProps {
  loading?: boolean;
  orderStats?: OrderStatsResponse | null;
  range: DashboardRange;
  slowItems?: MenuItemSales[];
  topItems?: MenuItemSales[];
}

const Menus = ({
  loading = false,
  orderStats,
  range,
  slowItems = [],
  topItems = [],
}: MenusProps) => {
  const tDashboard = useTranslations("dashboard");
  const tMenus = useTranslations("menus");
  const tOrder = useTranslations("order");

  const { chartColor, countAxis, periodLabel, warningColor } =
    useDashboardCharts(range);

  const modifiers = orderStats?.modifiers ?? [];

  const sweetnessLevels = emptyWhenAllZero(
    sweetnessLevelValues.map((level) => ({
      count:
        orderStats?.sweetnessLevels.find((entry) => entry.level === level)
          ?.sold ?? 0,
      label: tOrder(`menuItem.sweetnessLevels.${level}`),
    })),
  );

  const servingTemperatureLevels = emptyWhenAllZero(
    servingTemperatureLevelValues.map((level) => ({
      count:
        orderStats?.servingTemperatureLevels.find(
          (entry) => entry.level === level,
        )?.sold ?? 0,
      label: tOrder(`menuItem.servingTemperatureLevels.${level}`),
    })),
  );

  return (
    <>
      <Typography component="h2" variant="h6">
        {tMenus("label")}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.topItems")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: topItems.map(({ quantity }) => quantity),
                  label: tDashboard("charts.topItems"),
                  layout: "horizontal",
                },
              ]}
              gradientId="top-items"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: topItems.map(({ name }) => name),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} horizontal id="top-items" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.slowItems")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: warningColor,
                  data: slowItems.map(({ quantity }) => quantity),
                  label: tDashboard("charts.slowItems"),
                  layout: "horizontal",
                },
              ]}
              gradientId="slow-items"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: slowItems.map(({ name }) => name),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={warningColor} horizontal id="slow-items" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.topModifiers")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: modifiers.map(({ sold }) => sold),
                  label: tDashboard("charts.topModifiers"),
                  layout: "horizontal",
                },
              ]}
              gradientId="top-modifiers"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: modifiers.map(({ modifierGroupName, modifierName }) =>
                    tDashboard("charts.modifierOption", {
                      group: modifierGroupName,
                      option: modifierName,
                    }),
                  ),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} horizontal id="top-modifiers" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.sweetnessLevels")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: sweetnessLevels.map(({ count }) => count),
                  label: tDashboard("charts.sweetnessLevels"),
                  layout: "horizontal",
                },
              ]}
              gradientId="sweetness-levels"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: sweetnessLevels.map(({ label }) => label),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient
                color={chartColor}
                horizontal
                id="sweetness-levels"
              />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.servingTemperatureLevels")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: servingTemperatureLevels.map(({ count }) => count),
                  label: tDashboard("charts.servingTemperatureLevels"),
                  layout: "horizontal",
                },
              ]}
              gradientId="serving-temperature-levels"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: servingTemperatureLevels.map(({ label }) => label),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient
                color={chartColor}
                horizontal
                id="serving-temperature-levels"
              />
            </StyledBarChart>
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
};

export default Menus;
