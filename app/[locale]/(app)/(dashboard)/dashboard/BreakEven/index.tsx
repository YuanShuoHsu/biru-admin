"use client";

import { useTranslations } from "next-intl";

import ChartCard from "../ChartCard";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { Grid, LinearProgress, Typography } from "@mui/material";

import type { BreakEvenReportResponse } from "@/types/reports";

import { getHref } from "@/utils/href";

interface BreakEvenProps {
  breakEven: BreakEvenReportResponse;
  currency: string;
  organizationSlug: string;
}

const BreakEven = ({
  breakEven,
  currency,
  organizationSlug,
}: BreakEvenProps) => {
  const formatMoney = useFormatMoney();

  const tDashboard = useTranslations("dashboard");
  const tReports = useTranslations("reports");

  const {
    breakEvenRevenue,
    dailyBreakEvenRevenue,
    remainingDailyBreakEvenRevenue,
    revenue,
  } = breakEven;

  const href = getHref("/reports", {
    month: breakEven.month,
    organization: organizationSlug,
    tab: "breakEven",
  });

  return (
    <>
      <Typography component="h2" variant="h6">
        {tReports("tabs.breakEven")}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ChartCard
            href={href}
            period={tDashboard("breakEven.period")}
            title={tReports("breakEven.summary.breakEvenRevenue")}
            value={
              <Typography component="p" variant="h4">
                {breakEvenRevenue === null
                  ? tDashboard("breakEven.unavailable")
                  : formatMoney(breakEvenRevenue, currency)}
              </Typography>
            }
          >
            {breakEvenRevenue !== null && (
              <>
                <LinearProgress
                  value={
                    breakEvenRevenue > 0
                      ? Math.min((revenue / breakEvenRevenue) * 100, 100)
                      : 100
                  }
                  variant="determinate"
                />
                <Typography variant="body2">
                  {tDashboard("breakEven.reached", {
                    revenue: formatMoney(revenue, currency),
                  })}
                </Typography>
              </>
            )}
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ChartCard
            href={href}
            period={tDashboard("breakEven.period")}
            title={tReports("breakEven.summary.dailyBreakEvenRevenue")}
            value={
              <Typography component="p" variant="h4">
                {dailyBreakEvenRevenue === null
                  ? tDashboard("breakEven.unavailable")
                  : formatMoney(dailyBreakEvenRevenue, currency)}
              </Typography>
            }
          >
            {remainingDailyBreakEvenRevenue !== null && (
              <Typography variant="body2">
                {tDashboard("breakEven.remainingDaily", {
                  amount: formatMoney(remainingDailyBreakEvenRevenue, currency),
                  days: breakEven.remainingOpenDays,
                })}
              </Typography>
            )}
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
};

export default BreakEven;
