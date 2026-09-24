"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type DraftForm, useDraftFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceEmployee } from "@/types/attendance";

import { attendanceErrorKey, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface DraftDialogProps {
  employees: AttendanceEmployee[];
  mutate: () => void;
  organizationSlug: string;
}

const DraftDialog = ({
  employees,
  mutate,
  organizationSlug,
}: DraftDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const draftFormSchema = useDraftFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<DraftForm>({
    defaultValues: {
      employeeId: "",
      month: dayjs().tz(STORE_TIMEZONE).subtract(1, "month").format("YYYY-MM"),
      reason: "",
    },
    resolver: zodResolver(draftFormSchema),
  });

  const [employeeId, month] = useWatch({
    control,
    name: ["employeeId", "month"],
  });

  const onSubmitHandler = async (values: DraftForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(payrollPath(organizationSlug, "org", "statements"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          idempotencyKey: crypto.randomUUID(),
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
    <FormBox id="payroll-draft-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.employeeId}
        fullWidth
        helperText={errors.employeeId?.message}
        label={tAttendance("employee")}
        onChange={(event) =>
          setValue("employeeId", event.target.value, {
            shouldValidate: isSubmitted,
          })
        }
        required
        select
        value={employeeId}
      >
        {employees.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      <DatePicker
        label={tAttendance("month")}
        onChange={(value) =>
          setValue("month", value?.isValid() ? value.format("YYYY-MM") : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.month,
            fullWidth: true,
            helperText: errors.month?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={month ? dayjs(month, "YYYY-MM") : null}
        views={["year", "month"]}
      />
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("reason.label")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default DraftDialog;
