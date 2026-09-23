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

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox, FormControlLabel, TextField } from "@mui/material";
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

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const employeeFormSchema = useEmployeeFormSchema();

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
      userId: member.userId,
    },
    resolver: zodResolver(employeeFormSchema),
  });

  const [enabled, hiredAt, terminatedAt] = useWatch({
    control,
    name: ["enabled", "hiredAt", "terminatedAt"],
  });

  const onSubmitHandler = async (values: EmployeeForm) => {
    try {
      setDialog({ confirmLoading: true });

      const body: SaveAttendanceEmployee = {
        enabled: values.enabled,
        hiredAt: values.hiredAt,
        userId: values.userId,
        ...(values.terminatedAt && { terminatedAt: values.terminatedAt }),
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
