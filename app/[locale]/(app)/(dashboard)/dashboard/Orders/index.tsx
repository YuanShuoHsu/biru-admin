"use client";

import { useFormatter, useTranslations } from "next-intl";

import AreaGradient from "../AreaGradient";
import ChartCard from "../ChartCard";
import type { DashboardRange } from "../definitions";
import { RevenueValueStack, StyledBarChart, StyledLineChart } from "../styled";
import {
  AXIS_TICK_NUMBER,
  useDashboardCharts,
  useTrendLabels,
} from "../useDashboardCharts";

import { Grid, Typography } from "@mui/material";

import {
  orderResponseDtoModeValues,
  refundReasonCodeValues,
} from "@/types/api";
import type { OrderStatsResponse } from "@/types/orders";

import { emptyWhenAllZero, sumOf, toHourlyRows } from "@/utils/dashboard";

interface OrdersProps {
  loading?: boolean;
  orderStats?: OrderStatsResponse | null;
  range?: DashboardRange;
}

const Orders = ({ loading = false, orderStats, range }: OrdersProps) => {
  const format = useFormatter();

  const tDashboard = useTranslations("dashboard");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const { chartColor, countAxis, periodLabel, tickStep } =
    useDashboardCharts(range);

  const orderBuckets = orderStats?.buckets ?? [];

  const trendLabels = useTrendLabels(
    orderBuckets.map(({ start }) => start),
    range,
  );

  const periodOrderCount = sumOf(orderBuckets.map(({ orders }) => orders));

  const refundedOrders = {
    data: orderBuckets.map(({ refundedOrders }) => refundedOrders),
    refundedPeriodOrders: orderStats?.refundedPeriodOrders ?? 0,
    total: orderStats?.refundedOrders ?? 0,
  };

  const peakHours = toHourlyRows(
    orderStats?.hourlyOrders ?? Array<number>(24).fill(0),
  );

  const modes = emptyWhenAllZero(
    orderResponseDtoModeValues.map((mode) => ({
      count:
        orderStats?.modes.find((entry) => entry.mode === mode)?.orders ?? 0,
      label: tOrder(`mode.${mode}.label`),
    })),
  );

  const payments = [...(orderStats?.paymentMethods ?? [])]
    .sort((a, b) => b.orders - a.orders)
    .map(({ orders, paymentMethod }) => ({
      count: orders,
      label: tOrder(`checkout.payment.${paymentMethod}`),
    }));

  const refundReasons = emptyWhenAllZero(
    refundReasonCodeValues.map((reasonCode) => ({
      count:
        orderStats?.refundReasons.find(
          (entry) => entry.reasonCode === reasonCode,
        )?.refunds ?? 0,
      label: tOrders(`detail.refunds.reasonCode.${reasonCode}`),
    })),
  );
  const refundReasonTotal = sumOf(refundReasons.map(({ count }) => count));

  const refundedItems = orderStats?.refundedItems ?? [];

  return (
    <>
      <Typography component="h2" variant="h6">
        {tOrders("label")}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={12}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.peakHours")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ horizontal: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: peakHours.map(({ count }) => count),
                  label: tDashboard("charts.peakHours"),
                },
              ]}
              gradientId="peak-hours"
              xAxis={[
                {
                  data: peakHours.map(({ label }) => label),
                  scaleType: "band",
                  tickInterval: (_, index) => index % 3 === 0,
                },
              ]}
              yAxis={[
                {
                  ...countAxis,
                  tickNumber: AXIS_TICK_NUMBER,
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} id="peak-hours" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            chartHeight={250}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.orderModes")}
          >
            <StyledBarChart
              sx={{ minHeight: 250 }}
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
              gradientId="order-modes"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: modes.map(({ label }) => label),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} horizontal id="order-modes" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            chartHeight={250}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.paymentMethods")}
          >
            <StyledBarChart
              sx={{ minHeight: 250 }}
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
              gradientId="payment-methods"
              xAxis={[countAxis]}
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
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            chartHeight={250}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.refundedOrders")}
            value={
              <RevenueValueStack direction="row">
                <Typography component="p" variant="h4">
                  {format.number(refundedOrders.total)}
                </Typography>
                {periodOrderCount > 0 && (
                  <Typography color="textSecondary" variant="body2">
                    {tDashboard("charts.refundRate", {
                      rate: format.number(
                        refundedOrders.refundedPeriodOrders / periodOrderCount,
                        { maximumFractionDigits: 1, style: "percent" },
                      ),
                    })}
                  </Typography>
                )}
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
                  data: refundedOrders.data,
                  id: "refunded-orders",
                  label: tDashboard("charts.refundedOrders"),
                  showMark: false,
                },
              ]}
              gradientId="refunded-orders"
              xAxis={[
                {
                  data: trendLabels,
                  scaleType: "point",
                  tickInterval: (_, index) => (index + 1) % tickStep === 0,
                },
              ]}
              yAxis={[
                {
                  ...countAxis,
                  tickNumber: AXIS_TICK_NUMBER,
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} id="refunded-orders" />
            </StyledLineChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.refundReasons")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  barLabel: ({ value }) =>
                    refundReasonTotal && value !== null
                      ? format.number(value / refundReasonTotal, {
                          style: "percent",
                        })
                      : null,
                  barLabelPlacement: "outside",
                  color: chartColor,
                  data: refundReasons.map(({ count }) => count),
                  label: tDashboard("charts.refundReasons"),
                  layout: "horizontal",
                },
              ]}
              gradientId="refund-reasons"
              xAxis={[
                {
                  domainLimit: (_, max) => ({
                    min: 0,
                    max: Number(max) * 1.2,
                  }),
                  ...countAxis,
                },
              ]}
              yAxis={[
                {
                  data: refundReasons.map(({ label }) => label),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} horizontal id="refund-reasons" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard
            chartHeight={300}
            loading={loading}
            period={periodLabel}
            title={tDashboard("charts.refundedItems")}
          >
            <StyledBarChart
              sx={{ minHeight: 300 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: refundedItems.map(({ quantity }) => quantity),
                  label: tDashboard("charts.refundedItems"),
                  layout: "horizontal",
                },
              ]}
              gradientId="refunded-items"
              xAxis={[countAxis]}
              yAxis={[
                {
                  data: refundedItems.map(({ menuItemName }) => menuItemName),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient color={chartColor} horizontal id="refunded-items" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
};

export default Orders;
