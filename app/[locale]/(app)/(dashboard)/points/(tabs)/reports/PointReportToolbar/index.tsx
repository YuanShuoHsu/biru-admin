// https://nextjs.org/docs/app/guides/interactive-apps#step-3-filter-with-pending-feedback

"use client";

import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useMonthFormat } from "@/hooks/useMonthFormat";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import {
  MONTH_FORMAT,
  toStoreDate,
} from "@/app/[locale]/(app)/(dashboard)/reports/definitions";

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

export const usePointReportMonth = (month: string) => {
  const [isPending, startTransition] = useTransition();
  const [optimisticMonth, setOptimisticMonth] = useOptimistic(month);

  const updateQuery = useUpdateQuery();

  const changeMonth = (value: string) =>
    startTransition(() => {
      setOptimisticMonth(value);
      updateQuery({ month: value });
    });

  return { changeMonth, isPending, month: optimisticMonth };
};

interface PointReportToolbarProps {
  accountingValuePerPoint: string | null;
  month: string;
  onMonthChange: (month: string) => void;
}

const PointReportToolbar = ({
  accountingValuePerPoint,
  month,
  onMonthChange,
}: PointReportToolbarProps) => {
  const monthFormat = useMonthFormat();

  const tPointReports = useTranslations("pointReports");

  return (
    <ToolbarStack direction="row">
      <DatePicker
        disableFuture
        format={monthFormat}
        label={tPointReports("month")}
        minDate={toStoreDate("2000-01-01")}
        onChange={(value, { validationError }) => {
          if (!validationError && value?.isValid())
            onMonthChange(value.format(MONTH_FORMAT));
        }}
        timezone={STORE_TIMEZONE}
        value={toStoreDate(`${month}-01`)}
        views={["year", "month"]}
      />
      <Typography color="textSecondary" variant="body2">
        {accountingValuePerPoint != null
          ? tPointReports("accountingValuePerPoint", {
              value: Number(accountingValuePerPoint),
            })
          : tPointReports("accountingValueUnset")}
      </Typography>
    </ToolbarStack>
  );
};

export default PointReportToolbar;
