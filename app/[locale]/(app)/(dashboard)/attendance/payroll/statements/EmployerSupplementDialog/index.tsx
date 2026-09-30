"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { useState } from "react";
import useSWR from "swr";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useMonthFormat } from "@/hooks/useMonthFormat";

import { Stack, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import type { EmployerHealthSupplement } from "@/types/attendance";

import { fromCents, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

const AMOUNT_FIELDS = ["salaryCents", "insuredCents", "premiumCents"] as const;

interface EmployerSupplementDialogProps {
  currency: string;
  organizationSlug: string;
}

const EmployerSupplementDialog = ({
  currency,
  organizationSlug,
}: EmployerSupplementDialogProps) => {
  const tAttendance = useTranslations("attendance");

  const formatMoney = useFormatMoney();

  const monthFormat = useMonthFormat();

  const [month, setMonth] = useState(() =>
    dayjs().tz(STORE_TIMEZONE).subtract(1, "month").format("YYYY-MM"),
  );

  const { data } = useSWR(
    `${payrollPath(organizationSlug, "org", "employer-health-supplement")}?${new URLSearchParams({ month })}`,
    (url: string) => fetcher<EmployerHealthSupplement>(url),
  );

  return (
    <StyledStack>
      <DatePicker
        format={monthFormat}
        label={tAttendance("month")}
        onChange={(value) => {
          if (value?.isValid()) setMonth(value.format("YYYY-MM"));
        }}
        slotProps={{ textField: { fullWidth: true } }}
        timezone={STORE_TIMEZONE}
        value={dayjs.tz(`${month}-01`, STORE_TIMEZONE)}
        views={["year", "month"]}
      />
      {AMOUNT_FIELDS.map((field) => (
        <TextField
          fullWidth
          helperText={
            field === "insuredCents" && data?.unpublishedEmployees
              ? tAttendance("employerSupplement.unpublished", {
                  count: data.unpublishedEmployees,
                })
              : undefined
          }
          key={field}
          label={tAttendance(`employerSupplement.${field}`)}
          slotProps={{ input: { readOnly: true } }}
          value={
            data
              ? formatMoney(fromCents(data[field]), currency, {
                  minimumFractionDigits: 2,
                })
              : ""
          }
        />
      ))}
    </StyledStack>
  );
};

export default EmployerSupplementDialog;
