"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import { type SubstituteForm, useSubstituteFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceHolidaySubstitute,
  AttendanceShift,
} from "@/types/attendance";

import {
  attendanceCalendarPath,
  attendanceErrorKey,
  attendancePath,
  formatScheduledShift,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const SUBSTITUTE_SEARCH_DAYS = 90;

interface SubstituteDialogProps {
  mutate: () => void;
  organizationSlug: string;
  row: AttendanceHolidaySubstitute;
}

const SubstituteDialog = ({
  mutate,
  organizationSlug,
  row,
}: SubstituteDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const substituteFormSchema = useSubstituteFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<SubstituteForm>({
    defaultValues: { shiftId: "" },
    resolver: zodResolver(substituteFormSchema),
  });

  const shiftId = useWatch({ control, name: "shiftId" });

  const holiday = dayjs.tz(row.holidayDate, STORE_TIMEZONE);
  const from = holiday.startOf("week").toISOString();
  const to = holiday.add(SUBSTITUTE_SEARCH_DAYS, "day").toISOString();

  const { data: shifts = [] } = useSWR(
    attendanceCalendarPath(organizationSlug, "shifts", from, to),
    (url: string) => fetcher<AttendanceShift[]>(url),
  );

  const options = shifts.filter(
    (shift) =>
      shift.employeeId === row.employeeId &&
      shift.dayKind === "workday" &&
      shift.status !== "cancelled",
  );

  const onSubmitHandler = async (values: SubstituteForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(organizationSlug, "org", "holiday-substitutes"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: row.employeeId,
            holidayDate: row.holidayDate,
            shiftId: values.shiftId,
          }),
        },
      );

      enqueueSnackbar(
        tAttendance("holidaySubstitutes.substituteDesignated", {
          holiday: row.holidayName,
          name: row.employeeName,
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-holiday-substitute-form" onSubmit={onSubmit}>
      <TextField
        fullWidth
        label={tAttendance("employee")}
        slotProps={{ input: { readOnly: true } }}
        value={row.employeeName}
      />
      <TextField
        error={!!errors.shiftId}
        fullWidth
        helperText={errors.shiftId?.message}
        label={tAttendance("holidaySubstitutes.substituteShift")}
        onChange={(event) =>
          setValue("shiftId", event.target.value, {
            shouldValidate: isSubmitted,
          })
        }
        required
        select
        value={shiftId}
      >
        {options.map((shift) => (
          <MenuItem key={shift.id} value={shift.id}>
            {formatScheduledShift(format, shift)}
          </MenuItem>
        ))}
      </TextField>
    </FormBox>
  );
};

export default SubstituteDialog;
