"use client";

import { useFormatter, useTranslations } from "next-intl";

import AreaGradient from "../AreaGradient";
import ChartCard from "../ChartCard";
import type { DashboardRange } from "../definitions";
import { StyledBarChart } from "../styled";
import { AXIS_TICK_NUMBER, useDashboardCharts } from "../useDashboardCharts";

import { useRoutes } from "@/hooks/useRoutes";

import { Grid, Typography } from "@mui/material";

import type { WaitlistStats } from "@/types/waitlist";

import { emptyWhenAllZero, sumOf, toHourlyRows } from "@/utils/dashboard";

interface WaitlistProps {
  range: DashboardRange;
  waitlist: WaitlistStats;
}

const Waitlist = ({ range, waitlist }: WaitlistProps) => {
  const format = useFormatter();

  const tDashboard = useTranslations("dashboard");
  const tWaitlist = useTranslations("waitlist");

  const navItem = useRoutes();

  const { chartColor, countAxis, periodLabel } = useDashboardCharts(range);

  const outcomes = emptyWhenAllZero(
    (["seated", "noShow", "cancelled", "expired"] as const).map((status) => ({
      count: waitlist[status],
      label: tWaitlist(`status.${status}`),
    })),
  );
  const endedCount = sumOf(outcomes.map(({ count }) => count));

  const hourly = toHourlyRows(waitlist.hourlyTickets);

  return (
    <>
      <Typography component="h2" variant="h6">
        {tWaitlist("label")}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ChartCard
            href={navItem("/waitlist/list").to}
            period={periodLabel}
            title={tDashboard("waitlist.total")}
            value={
              <Typography component="p" variant="h4">
                {format.number(waitlist.total)}
              </Typography>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ChartCard
            period={periodLabel}
            title={tDashboard("waitlist.medianWait")}
            value={
              <Typography component="p" variant="h4">
                {waitlist.medianWaitMinutes === null ||
                waitlist.medianWaitMinutes === undefined
                  ? "—"
                  : tDashboard("waitlist.medianWaitValue", {
                      minutes: waitlist.medianWaitMinutes,
                    })}
              </Typography>
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            chartHeight={250}
            period={periodLabel}
            title={tDashboard("waitlist.outcomes")}
          >
            <StyledBarChart
              sx={{ minHeight: 250 }}
              hideLegend
              grid={{ vertical: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  barLabel: ({ value }) =>
                    endedCount && value !== null
                      ? format.number(value / endedCount, {
                          style: "percent",
                        })
                      : null,
                  barLabelPlacement: "outside",
                  color: chartColor,
                  data: outcomes.map(({ count }) => count),
                  label: tDashboard("waitlist.outcomes"),
                  layout: "horizontal",
                },
              ]}
              gradientId="waitlist-outcomes"
              xAxis={[
                {
                  // 長條外側的百分比畫在繪圖區的 clip-path 內，不留空間最長那條的標籤會被裁掉
                  domainLimit: (_, max) => ({
                    min: 0,
                    max: Number(max) * 1.2,
                  }),
                  ...countAxis,
                },
              ]}
              yAxis={[
                {
                  data: outcomes.map(({ label }) => label),
                  scaleType: "band",
                  width: "auto",
                },
              ]}
            >
              <AreaGradient
                color={chartColor}
                horizontal
                id="waitlist-outcomes"
              />
            </StyledBarChart>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ChartCard
            chartHeight={250}
            period={periodLabel}
            title={tDashboard("waitlist.hourlyTickets")}
          >
            <StyledBarChart
              sx={{ minHeight: 250 }}
              hideLegend
              grid={{ horizontal: true }}
              margin={{ left: 0, bottom: 0 }}
              series={[
                {
                  color: chartColor,
                  data: hourly.map(({ count }) => count),
                  label: tDashboard("waitlist.hourlyTickets"),
                },
              ]}
              gradientId="waitlist-hourly"
              xAxis={[
                {
                  data: hourly.map(({ label }) => label),
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
              <AreaGradient color={chartColor} id="waitlist-hourly" />
            </StyledBarChart>
          </ChartCard>
        </Grid>
      </Grid>
    </>
  );
};

export default Waitlist;
