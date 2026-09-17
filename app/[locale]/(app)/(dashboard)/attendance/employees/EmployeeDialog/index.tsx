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

import {
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceEmployee, AttendanceMember } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface EmployeeDialogProps {
  employee?: AttendanceEmployee;
  members: AttendanceMember[];
  mutate: () => void;
  organizationSlug: string;
}

const EmployeeDialog = ({
  employee,
  members,
  mutate,
  organizationSlug,
}: EmployeeDialogProps) => {
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
        dayjs().tz(STORE_TIMEZONE).startOf("day").toISOString(),
      terminatedAt: employee?.terminatedAt ?? "",
      userId: employee?.userId ?? "",
      weeklyMinutes: employee?.weeklyMinutes ?? 2400,
      weeklyMinutesFrom: "",
    },
    resolver: zodResolver(employeeFormSchema),
  });

  const [
    enabled,
    hiredAt,
    terminatedAt,
    userId,
    weeklyMinutes,
    weeklyMinutesFrom,
  ] = useWatch({
    control,
    name: [
      "enabled",
      "hiredAt",
      "terminatedAt",
      "userId",
      "weeklyMinutes",
      "weeklyMinutesFrom",
    ],
  });

  const onSubmitHandler = async ({
    weeklyMinutesFrom,
    ...values
  }: EmployeeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "all", "employees"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          terminatedAt: values.terminatedAt || null,
          ...(weeklyMinutesFrom && { weeklyMinutesFrom }),
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
      {employee ? (
        <Typography>{employee.name}</Typography>
      ) : (
        <TextField
          error={!!errors.userId}
          fullWidth
          helperText={errors.userId?.message}
          label={tAttendance("member")}
          onChange={(event) =>
            setValue("userId", event.target.value, {
              shouldValidate: isSubmitted,
            })
          }
          required
          select
          value={userId}
        >
          {members.map(({ name, userId: value }) => (
            <MenuItem key={value} value={value}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      )}
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
      <NumberSpinner
        error={!!errors.weeklyMinutes}
        fullWidth
        helperText={errors.weeklyMinutes?.message}
        label={tAttendance("weeklyMinutes")}
        max={2400}
        min={1}
        onValueChange={(value) =>
          setValue("weeklyMinutes", value ?? 1, { shouldValidate: isSubmitted })
        }
        value={weeklyMinutes}
      />
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
              helperText: errors.weeklyMinutesFrom?.message,
              required: true,
            },
          }}
          timezone={STORE_TIMEZONE}
          value={weeklyMinutesFrom ? dayjs(weeklyMinutesFrom) : null}
        />
      )}
    </FormBox>
  );
};

export default EmployeeDialog;
