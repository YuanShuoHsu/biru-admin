"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import { DASHBOARD_RANGES, type DashboardRange } from "./definitions";

import { useNavItem } from "@/hooks/useNavItem";

import { useRouter } from "@/i18n/navigation";

import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";

import {
  orderResponseDtoModeValues,
  orderResponseDtoPaymentMethodValues,
} from "@/types/api";
import type { OrderMode, OrderPaymentMethod } from "@/types/orders";

const StyledCard = styled(Card)({
  height: "100%",
});

const StyledCardActionArea = styled(CardActionArea)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
});

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

const TREND_NEUTRAL_THRESHOLD = 5;

// https://github.com/mui/material-ui/blob/master/docs/data/material/getting-started/templates/dashboard/components/SessionsChart.tsx
const AreaGradient = ({
  color,
  horizontal,
  id,
}: {
  color: string;
  horizontal?: boolean;
  id: string;
}) => (
  <defs>
    <linearGradient
      id={id}
      x1={horizontal ? "100%" : "50%"}
      y1={horizontal ? "50%" : "0%"}
      x2={horizontal ? "0%" : "50%"}
      y2={horizontal ? "50%" : "100%"}
    >
      <stop offset="0%" stopColor={color} stopOpacity={0.5} />
      <stop offset="100%" stopColor={color} stopOpacity={0} />
    </linearGradient>
  </defs>
);

interface Trend {
  data: number[];
  percent: number;
}

interface DashboardProps {
  currency: string;
  organizationSlug: string;
  range: DashboardRange;
  stats: {
    totalUsers: number | null;
    totalOrganizations: number;
    totalOrders: number;
    ordersTrend: Trend;
    revenueTrend: Trend;
    usersTrend: Trend | null;
    organizationsTrend: Trend;
  };
  charts: {
    topItems: { name: string; quantity: number }[];
    slowItems: { name: string; quantity: number }[];
    hourlyOrders: number[];
    modeCounts: Partial<Record<OrderMode, number>>;
    paymentCounts: Partial<Record<OrderPaymentMethod, number>>;
  };
}

const Dashboard = ({
  currency,
  organizationSlug,
  range,
  stats,
  charts,
}: DashboardProps) => {
  const format = useFormatter();

  const router = useRouter();

  const theme = useTheme();

  const locale = useLocale();
  const tDashboard = useTranslations("dashboard");
  const tOrder = useTranslations("order");

  const navItem = useNavItem(organizationSlug);
  const ordersHref = navItem("/orders/list").to;

  const { hourly, bucketDays, tickStep } = DASHBOARD_RANGES[range];

  const trendLabels = useMemo(() => {
    const count = stats.ordersTrend.data.length;
    const now = new Date();
    const dayStart = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    if (hourly) {
      return Array.from({ length: count }, (_, index) =>
        format.dateTime(new Date(dayStart + index * 3_600_000), {
          hour: "numeric",
          minute: "numeric",
          timeZone: "UTC",
        }),
      );
    }

    const stepMs = bucketDays * 86_400_000;
    const dateFormat =
      bucketDays >= 28
        ? ({ month: "short", year: "numeric", timeZone: "UTC" } as const)
        : ({ day: "numeric", month: "short", timeZone: "UTC" } as const);

    return Array.from({ length: count }, (_, index) =>
      format.dateTime(
        new Date(dayStart - (count - 1 - index) * stepMs),
        dateFormat,
      ),
    );
  }, [bucketDays, format, hourly, stats.ordersTrend.data.length]);

  const periodLabel = tDashboard(`stats.period.${range}`);

  const statCards = [
    {
      label: tDashboard("stats.totalOrders"),
      value: stats.totalOrders,
      href: ordersHref,
      trend: stats.ordersTrend,
    },
    {
      label: tDashboard("stats.totalOrganizations"),
      value: stats.totalOrganizations,
      href: "/organizations",
      trend: stats.organizationsTrend,
    },
    ...(stats.totalUsers !== null && stats.usersTrend
      ? [
          {
            label: tDashboard("stats.totalUsers"),
            value: stats.totalUsers,
            href: navItem("/admins").to,
            trend: stats.usersTrend,
          },
        ]
      : []),
  ];

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

  const revenueTotal = stats.revenueTrend.data.reduce((sum, n) => sum + n, 0);
  const { chipColor: revenueChipColor, trendColor: revenueTrendColor } =
    getTrendColors(stats.revenueTrend.percent);

  const chartColor = theme.vars.palette.primary.main;
  const slowItemsColor = theme.vars.palette.warning.main;

  const hourLabels = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);

  const modes = orderResponseDtoModeValues.map((mode) => ({
    count: charts.modeCounts[mode] || 0,
    label: tOrder(`mode.${mode}.label`),
  }));

  const payments = orderResponseDtoPaymentMethodValues
    .map((method) => ({
      count: charts.paymentCounts[method] || 0,
      label: tOrder(`checkout.payment.${method}`),
    }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => b.count - a.count);

  const avgOrderValues = stats.revenueTrend.data.map((revenue, index) =>
    stats.ordersTrend.data[index]
      ? Math.round(revenue / stats.ordersTrend.data[index])
      : 0,
  );
  const periodOrderCount = stats.ordersTrend.data.reduce(
    (sum, n) => sum + n,
    0,
  );
  const avgOrderTotal = periodOrderCount
    ? Math.round(revenueTotal / periodOrderCount)
    : 0;

  return (
    <>
      <Typography color="text.primary" variant="h6">
        {tDashboard("overview")}
      </Typography>
      <Grid container spacing={2}>
        {statCards.map(({ label, value, href, trend }, index) => {
          const { chipColor, trendColor } = getTrendColors(trend.percent);

          return (
            <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
              <StyledCard variant="outlined">
                <StyledCardActionArea onClick={() => router.push(href)}>
                  <StyledCardContent>
                    <Typography variant="subtitle2">{label}</Typography>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="h4">
                        {value.toLocaleString(locale)}
                      </Typography>
                      <Chip
                        color={chipColor}
                        label={`${trend.percent > 0 ? "+" : ""}${trend.percent}%`}
                        size="small"
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {periodLabel}
                    </Typography>
                    <SparkLineChart
                      data={trend.data}
                      area
                      height={50}
                      showHighlight
                      showTooltip
                      color={trendColor}
                      sx={{
                        "& .MuiLineChart-area": {
                          fill: `url('#area-gradient-${index}')`,
                        },
                      }}
                      xAxis={{ data: trendLabels, scaleType: "band" }}
                    >
                      <AreaGradient
                        color={trendColor}
                        id={`area-gradient-${index}`}
                      />
                    </SparkLineChart>
                  </StyledCardContent>
                </StyledCardActionArea>
              </StyledCard>
            </Grid>
          );
        })}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Typography component="h2" variant="subtitle2">
                {tDashboard("stats.revenue")}
              </Typography>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                gap={1}
              >
                <Typography variant="h4">
                  {`${currency} ${revenueTotal.toLocaleString(locale)}`.trim()}
                </Typography>
                <Chip
                  color={revenueChipColor}
                  label={`${stats.revenueTrend.percent > 0 ? "+" : ""}${stats.revenueTrend.percent}%`}
                  size="small"
                />
              </Stack>
              <Typography color="text.secondary" variant="caption">
                {periodLabel}
              </Typography>
              <LineChart
                height={250}
                hideLegend
                grid={{ horizontal: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    area: true,
                    color: revenueTrendColor,
                    curve: "linear",
                    data: stats.revenueTrend.data,
                    id: "revenue",
                    label: tDashboard("stats.revenue"),
                    showMark: false,
                    valueFormatter: (value) =>
                      `${currency} ${(value ?? 0).toLocaleString(locale)}`.trim(),
                  },
                ]}
                sx={{
                  "& .MuiLineChart-area": {
                    fill: "url('#revenue')",
                  },
                }}
                xAxis={[
                  {
                    data: trendLabels,
                    scaleType: "point",
                    tickInterval: (_, index) => (index + 1) % tickStep === 0,
                  },
                ]}
                yAxis={[{ width: "auto" }]}
              >
                <AreaGradient color={revenueTrendColor} id="revenue" />
              </LineChart>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Typography component="h2" variant="subtitle2">
                {tDashboard("charts.avgOrderValue")}
              </Typography>
              <Typography variant="h4">
                {`${currency} ${avgOrderTotal.toLocaleString(locale)}`.trim()}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {periodLabel}
              </Typography>
              <LineChart
                height={250}
                hideLegend
                grid={{ horizontal: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    area: true,
                    color: chartColor,
                    curve: "linear",
                    data: avgOrderValues,
                    id: "avg-order-value",
                    label: tDashboard("charts.avgOrderValue"),
                    showMark: false,
                    valueFormatter: (value) =>
                      `${currency} ${(value ?? 0).toLocaleString(locale)}`.trim(),
                  },
                ]}
                sx={{
                  "& .MuiLineChart-area": {
                    fill: "url('#avg-order-value')",
                  },
                }}
                xAxis={[
                  {
                    data: trendLabels,
                    scaleType: "point",
                    tickInterval: (_, index) => (index + 1) % tickStep === 0,
                  },
                ]}
                yAxis={[{ width: "auto" }]}
              >
                <AreaGradient color={chartColor} id="avg-order-value" />
              </LineChart>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Typography component="h2" variant="subtitle2">
                {tDashboard("charts.topItems")}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {periodLabel}
              </Typography>
              <BarChart
                height={300}
                hideLegend
                grid={{ vertical: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    color: chartColor,
                    data: charts.topItems.map(({ quantity }) => quantity),
                    label: tDashboard("charts.topItems"),
                    layout: "horizontal",
                  },
                ]}
                sx={{
                  "& .MuiBarChart-element": {
                    fill: "url('#top-items')",
                  },
                }}
                xAxis={[{ tickMinStep: 1 }]}
                yAxis={[
                  {
                    data: charts.topItems.map(({ name }) => name),
                    scaleType: "band",
                    width: "auto",
                  },
                ]}
              >
                <AreaGradient color={chartColor} horizontal id="top-items" />
              </BarChart>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Typography component="h2" variant="subtitle2">
                {tDashboard("charts.slowItems")}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {periodLabel}
              </Typography>
              <BarChart
                height={300}
                hideLegend
                grid={{ vertical: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    color: slowItemsColor,
                    data: charts.slowItems.map(({ quantity }) => quantity),
                    label: tDashboard("charts.slowItems"),
                    layout: "horizontal",
                  },
                ]}
                sx={{
                  "& .MuiBarChart-element": {
                    fill: "url('#slow-items')",
                  },
                }}
                xAxis={[{ tickMinStep: 1 }]}
                yAxis={[
                  {
                    data: charts.slowItems.map(({ name }) => name),
                    scaleType: "band",
                    width: "auto",
                  },
                ]}
              >
                <AreaGradient
                  color={slowItemsColor}
                  horizontal
                  id="slow-items"
                />
              </BarChart>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Typography component="h2" variant="subtitle2">
                {tDashboard("charts.peakHours")}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {periodLabel}
              </Typography>
              <BarChart
                height={300}
                hideLegend
                grid={{ horizontal: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    color: chartColor,
                    data: charts.hourlyOrders,
                    label: tDashboard("charts.peakHours"),
                  },
                ]}
                sx={{
                  "& .MuiBarChart-element": {
                    fill: "url('#peak-hours')",
                  },
                }}
                xAxis={[
                  {
                    data: hourLabels,
                    scaleType: "band",
                    tickInterval: (_, index) => index % 3 === 0,
                  },
                ]}
                yAxis={[{ tickMinStep: 1, width: "auto" }]}
              >
                <AreaGradient color={chartColor} id="peak-hours" />
              </BarChart>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Typography component="h2" variant="subtitle2">
                {tDashboard("charts.orderModes")}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {periodLabel}
              </Typography>
              <BarChart
                height={250}
                hideLegend
                grid={{ vertical: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    color: chartColor,
                    data: modes.map(({ count }) => count),
                    label: tDashboard("charts.orderModes"),
                    layout: "horizontal",
                  },
                ]}
                sx={{
                  "& .MuiBarChart-element": {
                    fill: "url('#order-modes')",
                  },
                }}
                xAxis={[{ tickMinStep: 1 }]}
                yAxis={[
                  {
                    data: modes.map(({ label }) => label),
                    scaleType: "band",
                    width: "auto",
                  },
                ]}
              >
                <AreaGradient color={chartColor} horizontal id="order-modes" />
              </BarChart>
            </StyledCardContent>
          </StyledCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <StyledCard variant="outlined">
            <StyledCardContent>
              <Typography component="h2" variant="subtitle2">
                {tDashboard("charts.paymentMethods")}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {periodLabel}
              </Typography>
              <BarChart
                height={250}
                hideLegend
                grid={{ vertical: true }}
                margin={{ left: 0, bottom: 0 }}
                series={[
                  {
                    color: chartColor,
                    data: payments.map(({ count }) => count),
                    label: tDashboard("charts.paymentMethods"),
                    layout: "horizontal",
                  },
                ]}
                sx={{
                  "& .MuiBarChart-element": {
                    fill: "url('#payment-methods')",
                  },
                }}
                xAxis={[{ tickMinStep: 1 }]}
                yAxis={[
                  {
                    data: payments.map(({ label }) => label),
                    scaleType: "band",
                    width: "auto",
                  },
                ]}
              >
                <AreaGradient
                  color={chartColor}
                  horizontal
                  id="payment-methods"
                />
              </BarChart>
            </StyledCardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;
