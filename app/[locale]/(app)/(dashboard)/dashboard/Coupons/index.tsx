"use client";

import { useTranslations } from "next-intl";

import AreaGradient from "../AreaGradient";
import ChartCard from "../ChartCard";
import type { DashboardRange } from "../definitions";
import { RevenueValueStack, StyledBarChart, StyledLineChart } from "../styled";
import { useDashboardCharts, useTrendLabels } from "../useDashboardCharts";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { Chip, Grid, Typography } from "@mui/material";

import type { OrderStatsResponse } from "@/types/orders";

import { getMoneyTrend, sumOf } from "@/utils/dashboard";

interface CouponsProps {
  currency?: string;
  loading?: boolean;
  orderStats?: OrderStatsResponse | null;
  range?: DashboardRange;
}

const Coupons = ({
  currency = "",
  loading = false,
  orderStats,
  range,
}: CouponsProps) => {
  const formatMoney = useFormatMoney();

  const tCoupons = useTranslations("coupons");
  const tDashboard = useTranslations("dashboard");

  const { chartColor, countAxis, moneyAxis, periodLabel, tickStep } =
    useDashboardCharts(range);

  const trendLabels = useTrendLabels(
    (orderStats?.buckets ?? []).map(({ start }) => start),
    range,
  );

  const discountTrend = loading
    ? { data: [], percent: 0 }
    : getMoneyTrend(orderStats ?? null, "discount");

  const coupons = orderStats?.coupons ?? [];

  return (
    <>
      <Typography component="h2" variant="h6">
        {tCoupons("label")}
      </Typography>
      <Grid container spacing={2}>
        {discountTrend && (
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard
              chartHeight={250}
              loading={loading}
              period={periodLabel}
              title={tDashboard("stats.discount")}
              value={
                <RevenueValueStack direction="row">
                  <Typography component="p" variant="h4">
                    {formatMoney(sumOf(discountTrend.data), currency)}
                  </Typography>
                  <Chip
                    label={`${discountTrend.percent > 0 ? "+" : ""}${discountTrend.percent}%`}
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
                    color: chartColor,
                    curve: "linear",
                    data: discountTrend.data,
                    id: "discount",
                    label: tDashboard("stats.discount"),
                    showMark: false,
                    valueFormatter: (value) =>
                      formatMoney(value ?? 0, currency),
                  },
                ]}
                gradientId="discount"
                xAxis={[
                  {
                    data: trendLabels,
                    scaleType: "point",
                    tickInterval: (_, index) => (index + 1) % tickStep === 0,
                  },
                ]}
                yAxis={[moneyAxis]}
              >
                <AreaGradient color={chartColor} id="discount" />
              </StyledLineChart>
            </ChartCard>
          </Grid>
        )}
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.couponUsage")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: coupons.map(({ orders }) => orders),
                  label: tDashboard("charts.couponUsage"),
                  layout: "horizontal",
                },
              ]}
              gradientId="coupon-usage"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: coupons.map(({ code }) => code),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} horizontal id="coupon-usage" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
};

export default Coupons;
