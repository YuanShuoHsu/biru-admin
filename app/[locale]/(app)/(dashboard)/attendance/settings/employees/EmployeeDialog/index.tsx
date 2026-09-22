"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type EmployeeForm, useEmployeeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceMember } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const FULL_TIME_MINUTES = 2400;

interface EmployeeDialogProps {
  member: AttendanceMember;
  mutate: () => void;
  organizationSlug: string;
}

const EmployeeDialog = ({
  member,
  mutate,
  organizationSlug,
}: EmployeeDialogProps) => {
  const employee = member.employee ?? undefined;

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const employeeFormSchema = useEmployeeFormSchema(employee);

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<EmployeeForm>({
    defaultValues: {
      enabled: employee?.enabled ?? true,
      hiredAt:
        employee?.hiredAt ??
        dayjs(member.joinedAt).tz(STORE_TIMEZONE).startOf("day").toISOString(),
      terminatedAt: employee?.terminatedAt ?? "",
      partTime:
        (employee?.weeklyMinutes ?? FULL_TIME_MINUTES) < FULL_TIME_MINUTES,
      userId: member.userId,
      weeklyMinutes: employee?.weeklyMinutes ?? FULL_TIME_MINUTES,
      weeklyMinutesFrom: "",
    },
    resolver: zodResolver(employeeFormSchema),
  });

  const [
    enabled,
    hiredAt,
    partTime,
    terminatedAt,
    weeklyMinutes,
    weeklyMinutesFrom,
  ] = useWatch({
    control,
    name: [
      "enabled",
      "hiredAt",
      "partTime",
      "terminatedAt",
      "weeklyMinutes",
      "weeklyMinutesFrom",
    ],
  });

  const onSubmitHandler = async (values: EmployeeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "employees"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: values.enabled,
          hiredAt: values.hiredAt,
          terminatedAt: values.terminatedAt || null,
          userId: values.userId,
          weeklyMinutes: values.weeklyMinutes,
          ...(values.weeklyMinutesFrom && {
            weeklyMinutesFrom: values.weeklyMinutesFrom,
          }),
        }),
      });

      enqueueSnackbar(tAttendance("success"), { variant: "success" });

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
    <FormBox id="attendance-employee-form" onSubmit={onSubmit}>
      <TextField
        fullWidth
        helperText={member.email}
        label={tAttendance("employee")}
        slotProps={{ input: { readOnly: true } }}
        value={member.name}
      />
      <DatePicker
        label={tAttendance("hiredAt")}
        maxDate={terminatedAt ? dayjs(terminatedAt) : undefined}
        onChange={(date) =>
          setValue(
            "hiredAt",
            date?.isValid() ? date.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.hiredAt,
            fullWidth: true,
            helperText: errors.hiredAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={hiredAt ? dayjs(hiredAt) : null}
      />
      <DatePicker
        label={tAttendance("terminatedAt")}
        minDate={hiredAt ? dayjs(hiredAt) : undefined}
        onChange={(date) =>
          setValue(
            "terminatedAt",
            date?.isValid() ? date.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          field: { clearable: true },
          textField: {
            error: !!errors.terminatedAt,
            fullWidth: true,
            helperText: errors.terminatedAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={terminatedAt ? dayjs(terminatedAt) : null}
      />
      <TextField
        fullWidth
        label={tAttendance("employmentType.label")}
        onChange={({ target: { value } }) => {
          const nextPartTime = value === "partTime";

          setValue("partTime", nextPartTime);

          if (!nextPartTime)
            setValue("weeklyMinutes", FULL_TIME_MINUTES, {
              shouldValidate: isSubmitted,
            });
        }}
        required
        select
        value={partTime ? "partTime" : "fullTime"}
      >
        {(["fullTime", "partTime"] as const).map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`employmentType.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      {partTime && (
        <NumberSpinner
          error={!!errors.weeklyMinutes}
          format={{ maximumFractionDigits: 1 }}
          fullWidth
          helperText={errors.weeklyMinutes?.message}
          label={tAttendance("weeklyMinutes")}
          max={FULL_TIME_MINUTES / 60}
          min={0.5}
          onValueChange={(value) =>
            setValue("weeklyMinutes", Math.round((value ?? 0.5) * 60), {
              shouldValidate: isSubmitted,
            })
          }
          step={0.5}
          value={weeklyMinutes / 60}
        />
      )}
      {!!employee && weeklyMinutes !== employee.weeklyMinutes && (
        <DatePicker
          label={tAttendance("weeklyMinutesFrom")}
          minDate={hiredAt ? dayjs(hiredAt) : undefined}
          onChange={(date) =>
            setValue(
              "weeklyMinutesFrom",
              date?.isValid() ? date.startOf("day").toISOString() : "",
              { shouldValidate: isSubmitted },
            )
          }
          slotProps={{
            textField: {
              error: !!errors.weeklyMinutesFrom,
              fullWidth: true,
              helperText:
                errors.weeklyMinutesFrom?.message ??
                tAttendance("weeklyMinutesFromHint"),
              required: true,
            },
          }}
          timezone={STORE_TIMEZONE}
          value={weeklyMinutesFrom ? dayjs(weeklyMinutesFrom) : null}
        />
      )}
      <FormControlLabel
        control={
          <Checkbox
            checked={enabled}
            onChange={(_, checked) => setValue("enabled", checked)}
          />
        }
        label={tAttendance("enabled")}
        sx={{ alignSelf: "flex-start" }}
      />
    </FormBox>
  );
};

export default EmployeeDialog;
