"use client";

import dayjs from "dayjs";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import DataGrid from "@/components/DataGrid";
import EmptyCell from "@/components/EmptyCell";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";

import { Typography } from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import type { AttendanceAnnualLeaveNotice } from "@/types/attendance";

import { formatLeaveDuration, fromCents } from "@/utils/attendance";

interface MyAnnualLeaveNoticesProps {
  currency: string;
  notices: AttendanceAnnualLeaveNotice[];
}

const MyAnnualLeaveNotices = ({
  currency,
  notices,
}: MyAnnualLeaveNoticesProps) => {
  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const tAttendance = useTranslations("attendance");

  const columns = useMemo<GridColDef[]>(() => {
    const duration = (minutes: number) =>
      formatLeaveDuration(tAttendance, minutes, false);

    return [
      {
        field: "periodStart",
        headerName: tAttendance("annualLeaveNotices.period"),
        valueGetter: (
          _,
          { periodEnd, periodStart }: AttendanceAnnualLeaveNotice,
        ) =>
          format.dateTimeRange(
            new Date(periodStart),
            new Date(periodEnd),
            "dateTime",
          ),
      },
      {
        field: "grantedMinutes",
        headerName: tAttendance("grantedMinutes"),
        valueFormatter: duration,
      },
      {
        field: "carriedInMinutes",
        headerName: tAttendance("annualLeaveNotices.carriedIn"),
        renderCell: ({
          value,
        }: GridRenderCellParams<AttendanceAnnualLeaveNotice, number>) =>
          value ? duration(value) : <EmptyCell />,
      },
      {
        field: "usedMinutes",
        headerName: tAttendance("usedMinutes"),
        valueFormatter: duration,
      },
      {
        field: "leaves",
        headerName: tAttendance("annualLeaveNotices.dates"),
        renderCell: ({
          row: { leaves },
        }: GridRenderCellParams<AttendanceAnnualLeaveNotice>) =>
          leaves.length ? (
            format.list(
              leaves.map(({ endsAt, startsAt }) =>
                format.dateTimeRange(
                  new Date(startsAt),
                  new Date(endsAt),
                  "dateTime",
                ),
              ),
              "enumeration",
            )
          ) : (
            <EmptyCell />
          ),
        sortable: false,
      },
      {
        field: "unusedMinutes",
        headerName: tAttendance("annualLeaveNotices.unused"),
        valueFormatter: duration,
      },
      {
        field: "payouts",
        headerName: tAttendance("annualLeaveNotices.settlement"),
        renderCell: ({
          row: { deferred, payouts, unusedMinutes },
        }: GridRenderCellParams<AttendanceAnnualLeaveNotice>) =>
          payouts.length ? (
            format.list(
              payouts.map(({ amountCents, month }) =>
                tAttendance("annualLeaveNotices.paid", {
                  amount: formatMoney(fromCents(amountCents), currency, {
                    minimumFractionDigits: 2,
                  }),
                  month: dayjs(month).format(monthFormat),
                }),
              ),
              "enumeration",
            )
          ) : deferred ? (
            tAttendance("annualLeaveNotices.deferred")
          ) : unusedMinutes ? (
            tAttendance("annualLeaveNotices.pending")
          ) : (
            <EmptyCell />
          ),
        sortable: false,
      },
    ];
  }, [currency, format, formatMoney, monthFormat, tAttendance]);

  return (
    <>
      <Typography component="h2" variant="h6">
        {tAttendance("annualLeaveNotices.label")}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {tAttendance("annualLeaveNotices.hint")}
      </Typography>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        disableColumnFilter
        getRowHeight={() => "auto"}
        getRowId={({ periodStart }) => periodStart}
        hideFooter
        rows={notices}
      />
    </>
  );
};

export default MyAnnualLeaveNotices;
