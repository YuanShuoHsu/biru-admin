"use client";

import { useFormatter, useTranslations } from "next-intl";

import AreaGradient from "../AreaGradient";
import ChartCard from "../ChartCard";
import type { DashboardRange } from "../definitions";
import {
  RevenueValueStack,
  StatValueStack,
  StyledLineChart,
  StyledSparkLineChart,
} from "../styled";
import { useDashboardCharts, useTrendLabels } from "../useDashboardCharts";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useRoutes } from "@/hooks/useRoutes";

import { Chip, Grid, Typography } from "@mui/material";

import { sumOf } from "@/utils/dashboard";

interface Trend {
  data: number[];
  percent: number;
}

interface OverviewProps {
  currency?: string;
  isAdmin?: boolean;
  loading?: boolean;
  range?: DashboardRange;
  stats?: {
    totalUsers: number | null;
    totalOrganizations: number;
    totalOrders: number;
    ordersTrend: Trend;
    revenueTrend: Trend | null;
    usersTrend: Trend | null;
    organizationsTrend: Trend;
  };
  trendStarts?: string[];
}

const EMPTY_TREND: Trend = { data: [], percent: 0 };

const Overview = ({
  currency = "",
  isAdmin = false,
  loading = false,
  range,
  stats,
  trendStarts = [],
}: OverviewProps) => {
  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const tDashboard = useTranslations("dashboard");

  const navItem = useRoutes();

  const { chartColor, getTrendColors, moneyAxis, periodLabel, tickStep } =
    useDashboardCharts(range);

  const trendLabels = useTrendLabels(trendStarts, range);

  const statCards = [
    {
      label: tDashboard("stats.totalOrders"),
      value: stats?.totalOrders ?? 0,
      href: navItem("/orders/list").to,
      trend: stats?.ordersTrend ?? EMPTY_TREND,
    },
    {
      label: tDashboard("stats.totalOrganizations"),
      value: stats?.totalOrganizations ?? 0,
      href: "/organizations",
      trend: stats?.organizationsTrend ?? EMPTY_TREND,
    },
    ...(isAdmin
      ? [
          {
            label: tDashboard("stats.totalUsers"),
            value: stats?.totalUsers ?? 0,
            href: navItem("/admins").to,
            trend: stats?.usersTrend ?? EMPTY_TREND,
          },
        ]
      : []),
  ];

  const revenueTrend = loading ? EMPTY_TREND : stats?.revenueTrend;

  const periodOrderCount = sumOf(stats?.ordersTrend.data ?? []);

  const revenue = revenueTrend && {
    ...getTrendColors(revenueTrend.percent),
    data: revenueTrend.data,
    percent: revenueTrend.percent,
    total: sumOf(revenueTrend.data),
    avgTotal: periodOrderCount
      ? Math.round(sumOf(revenueTrend.data) / periodOrderCount)
      : 0,
    avgValues: revenueTrend.data.map((value, index) =>
      stats?.ordersTrend.data[index]
        ? Math.round(value / stats.ordersTrend.data[index])
        : 0,
    ),
  };

  return (
    <>
      <Grid container spacing={2}>
        {statCards.map(({ label, value, href, trend }, index) => {
          const { chipColor, trendColor } = getTrendColors(trend.percent);

          return (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
              <ChartCard
                chartHeight={50}
                href={href}
                loading={loading}
                period={periodLabel}
                title={label}
                value={
                  <StatValueStack direction="row">
                    <Typography component="p" variant="h4">
                      {format.number(value)}
                    </Typography>
                    <Chip
                      color={chipColor}
                      label={`${trend.percent > 0 ? "+" : ""}${trend.percent}%`}
                      size="small"
                    />
                  </StatValueStack>
                }
              >
                <StyledSparkLineChart
                  data={trend.data}
                  area
                  height={50}
                  showHighlight
                  showTooltip
                  color={trendColor}
                  gradientId={`area-gradient-${index}`}
                  xAxis={{ data: trendLabels, scaleType: "band" }}
                >
                  <AreaGradient
                    color={trendColor}
                    id={`area-gradient-${index}`}
                  />
                </StyledSparkLineChart>
              </ChartCard>
            </Grid>
          );
        })}
      </Grid>
      {revenue && (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard
              chartHeight={250}
              loading={loading}
              period={periodLabel}
              title={tDashboard("stats.revenue")}
              value={
                <RevenueValueStack direction="row">
                  <Typography component="p" variant="h4">
                    {formatMoney(revenue.total, currency)}
                  </Typography>
                  <Chip
                    color={revenue.chipColor}
                    label={`${revenue.percent > 0 ? "+" : ""}${revenue.percent}%`}
                    size="small"
                  />
                </RevenueValueStack>
              }
            >
              <StyledLineChart
                sx={{ minHeight: 250 }}
                hideLegend
                grid={{ horizontal: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    area: true,
                    color: revenue.trendColor,
                    curve: "linear",
                    data: revenue.data,
                    id: "revenue",
                    label: tDashboard("stats.revenue"),
                    showMark: false,
                    valueFormatter: (value) =>
                      formatMoney(value ?? 0, currency),
                  },
                ]}
                gradientId="revenue"
                xAxis={[
                  {
                    data: trendLabels,
                    scaleType: "point",
                    tickInterval: (_, index) => (index + 1) % tickStep === 0,
                  },
                ]}
                yAxis={[moneyAxis]}
              >
                <AreaGradient color={revenue.trendColor} id="revenue" />
              </StyledLineChart>
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard
              chartHeight={250}
              loading={loading}
              period={periodLabel}
              title={tDashboard("charts.avgOrderValue")}
              value={
                <Typography component="p" variant="h4">
                  {formatMoney(revenue.avgTotal, currency)}
                </Typography>
              }
            >
              <StyledLineChart
                sx={{ minHeight: 250 }}
                hideLegend
                grid={{ horizontal: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    area: true,
                    color: chartColor,
                    curve: "linear",
                    data: revenue.avgValues,
                    id: "avg-order-value",
                    label: tDashboard("charts.avgOrderValue"),
                    showMark: false,
                    valueFormatter: (value) =>
                      formatMoney(value ?? 0, currency),
                  },
                ]}
                gradientId="avg-order-value"
                xAxis={[
                  {
                    data: trendLabels,
                    scaleType: "point",
                    tickInterval: (_, index) => (index + 1) % tickStep === 0,
                  },
                ]}
                yAxis={[moneyAxis]}
              >
                <AreaGradient color={chartColor} id="avg-order-value" />
              </StyledLineChart>
            </ChartCard>
          </Grid>
        </Grid>
      )}
    </>
  );
};

export default Overview;
