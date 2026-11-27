"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import PointReportToolbar, { usePointReportMonth } from "./PointReportToolbar";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useFormatMoney } from "@/hooks/useFormatMoney";

import { useRouter } from "@/i18n/navigation";

import { styled } from "@mui/material/styles";
import type { GridColDef, GridRowClassNameParams } from "@mui/x-data-grid";

import type { PointReport, PointReportRow } from "@/types/points";

const POINT_FIELDS = [
  "earnedPoints",
  "grantedPoints",
  "redeemedPoints",
  "usedAtOwnStorePoints",
  "usedAtOtherStoresPoints",
  "otherStoresUsedHerePoints",
  "crossStoreNetPoints",
  "unusedRedeemedPoints",
  "revokedPoints",
  "cancelledPoints",
  "adjustedPoints",
  "settledPoints",
  "expiredPoints",
  "outstandingPoints",
  "unallocatedLegacyPoints",
] as const;

const AMOUNT_FIELDS = [
  "earnedAmount",
  "grantedAmount",
  "redeemedAmount",
  "expiredAmount",
  "outstandingAmount",
  "crossStoreNetAmount",
] as const;

const StyledDataGrid = styled(DataGrid)({
  "& .store-row": {
    cursor: "pointer",
  },
});

const getRowClassName = (params: GridRowClassNameParams) =>
  `${DATA_GRID_PROPS.getRowClassName(params)}${params.row.organizationId ? " store-row" : ""}`;

interface PointReportsProps {
  report: PointReport;
}

const PointReports = ({ report }: PointReportsProps) => {
  const { changeMonth, isPending, month } = usePointReportMonth(report.month);

  const format = useFormatter();

  const formatMoney = useFormatMoney();

  const router = useRouter();

  const tPointReports = useTranslations("pointReports");

  const hasAmounts = report.accountingValuePerPoint != null;

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "organizationName",
        headerName: tPointReports("organizationName"),
        valueGetter: (
          value: string | null,
          { organizationId }: PointReportRow,
        ) => (organizationId === null ? tPointReports("legacy") : value),
      },
      ...POINT_FIELDS.map(
        (field): GridColDef => ({
          field,
          headerName: tPointReports(field),
          type: "number",
          valueFormatter: (value: number) => format.number(value),
        }),
      ),
      {
        field: "discountAmount",
        headerName: tPointReports("discountAmount"),
        type: "number",
        valueFormatter: (value: number) => formatMoney(value, null),
      },
      ...(hasAmounts
        ? AMOUNT_FIELDS.map(
            (field): GridColDef => ({
              field,
              headerName: tPointReports(field),
              type: "number",
              valueFormatter: (value: number) => formatMoney(value, null),
              valueGetter: (_value, { amounts }: PointReportRow) =>
                amounts?.[field],
            }),
          )
        : []),
    ],
    [format, formatMoney, hasAmounts, tPointReports],
  );

  return (
    <>
      <PointReportToolbar
        accountingValuePerPoint={report.accountingValuePerPoint}
        month={month}
        onMonthChange={changeMonth}
      />
      <StyledDataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        getRowClassName={getRowClassName}
        getRowId={({ organizationId }) => organizationId ?? ""}
        loading={isPending}
        onRowClick={({ row: { organizationId } }) => {
          if (organizationId)
            router.push(
              `/points/reports/${organizationId}?month=${report.month}`,
            );
        }}
        rows={report.rows.map((row) => ({ ...row, month: report.month }))}
        slotProps={{
          ...DATA_GRID_PROPS.slotProps,
          toolbar: { exportDateField: "month" },
        }}
      />
    </>
  );
};

export default PointReports;
