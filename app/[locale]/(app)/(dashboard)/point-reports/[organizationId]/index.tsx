"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import PointReportToolbar, { usePointReportMonth } from "../PointReportToolbar";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import type {
  PointReportCounterpart,
  PointReportDetail as PointReportDetailResponse,
} from "@/types/points";

const POINT_FIELDS = [
  "usedThereFromHerePoints",
  "usedHereFromTherePoints",
  "netPoints",
] as const;

interface PointReportDetailProps {
  detail: PointReportDetailResponse;
}

const PointReportDetail = ({ detail }: PointReportDetailProps) => {
  const { changeMonth, isPending, month } = usePointReportMonth(detail.month);

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const tPointReports = useTranslations("pointReports");

  const hasAmounts = detail.accountingValuePerPoint != null;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "organizationName",
        headerName: tPointReports("detail.counterpart"),
        valueGetter: (
          value: string | null,
          { organizationId }: PointReportCounterpart,
        ) => (organizationId === null ? tPointReports("legacy") : value),
      },
      ...POINT_FIELDS.map(
        (field): GridColDef => ({
          field,
          headerName: tPointReports(`detail.${field}`),
          type: "number",
          valueFormatter: (value: number) => format.number(value),
        }),
      ),
      ...(hasAmounts
        ? [
            {
              field: "netAmount",
              headerName: tPointReports("detail.netAmount"),
              renderCell: renderEmptyableCell,
              type: "number" as const,
              valueFormatter: (value: number | null) =>
                value === null ? "" : formatMoney(value, null),
            },
          ]
        : []),
    ],
    [format, formatMoney, hasAmounts, tPointReports],
  );

  return (
    <>
      <Typography variant="h6">{detail.organizationName}</Typography>
      <PointReportToolbar
        accountingValuePerPoint={detail.accountingValuePerPoint}
        month={month}
        onMonthChange={changeMonth}
      />
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        getRowId={({ organizationId }) => organizationId ?? ""}
        loading={isPending}
        rows={detail.rows.map((row) => ({ ...row, month: detail.month }))}
        slotProps={{
          ...DATA_GRID_PROPS.slotProps,
          toolbar: { exportDateField: "month" },
        }}
      />
    </>
  );
};

export default PointReportDetail;
