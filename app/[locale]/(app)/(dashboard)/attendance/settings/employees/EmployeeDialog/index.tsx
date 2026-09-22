"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type EmployeeForm, useEmployeeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { FULL_TIME_MINUTES } from "@/constants/attendance";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceMember,
  SaveAttendanceEmployee,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

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
  const scheduledChange = employee?.weeklyMinutesHistory.findLast(
    ({ from }) => new Date(from) > new Date(),
  );

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");
  const format = useFormatter();

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
        (scheduledChange?.minutes ??
          employee?.weeklyMinutes ??
          FULL_TIME_MINUTES) < FULL_TIME_MINUTES,
      userId: member.userId,
      weeklyMinutes:
        scheduledChange?.minutes ??
        employee?.weeklyMinutes ??
        FULL_TIME_MINUTES,
      weeklyMinutesFrom: scheduledChange?.from ?? "",
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

      const body: SaveAttendanceEmployee = {
        enabled: values.enabled,
        hiredAt: values.hiredAt,
        userId: values.userId,
        weeklyMinutes: values.weeklyMinutes,
        ...(values.terminatedAt && { terminatedAt: values.terminatedAt }),
        ...(values.weeklyMinutesFrom && {
          weeklyMinutesFrom: values.weeklyMinutesFrom,
        }),
      };

      await fetcher(attendancePath(organizationSlug, "org", "employees"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        maxDate={
          terminatedAt ? dayjs(terminatedAt).subtract(1, "day") : undefined
        }
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
        minDate={hiredAt ? dayjs(hiredAt).add(1, "day") : undefined}
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
        <>
          <Alert severity="info">
            {tAttendance("weeklyMinutesCurrentHint", {
              hours: format.number(employee.weeklyMinutes / 60, {
                maximumFractionDigits: 1,
              }),
            })}
          </Alert>
          <DatePicker
            label={tAttendance("weeklyMinutesFrom")}
            maxDate={
              terminatedAt ? dayjs(terminatedAt).subtract(1, "day") : undefined
            }
            minDate={hiredAt ? dayjs(hiredAt) : undefined}
            onChange={(date) => {
              if (!date) {
                setValue("weeklyMinutes", employee.weeklyMinutes);
                setValue(
                  "partTime",
                  employee.weeklyMinutes < FULL_TIME_MINUTES,
                );
              }

              setValue(
                "weeklyMinutesFrom",
                date?.isValid() ? date.startOf("day").toISOString() : "",
                { shouldValidate: isSubmitted },
              );
            }}
            slotProps={{
              field: { clearable: true },
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
        </>
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
