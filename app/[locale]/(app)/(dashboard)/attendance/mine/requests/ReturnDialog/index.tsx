"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type ReturnForm, useReturnFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceRequest } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface ReturnDialogProps {
  mutate: () => void;
  organizationSlug: string;
  request: AttendanceRequest;
}

const ReturnDialog = ({
  mutate,
  organizationSlug,
  request,
}: ReturnDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const returnFormSchema = useReturnFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ReturnForm>({
    defaultValues: {
      reason: "",
      returnsAt: dayjs()
        .tz(STORE_TIMEZONE)
        .add(1, "day")
        .startOf("day")
        .toISOString(),
    },
    resolver: zodResolver(returnFormSchema),
  });

  const returnsAt = useWatch({ control, name: "returnsAt" });

  const date = (value: string) => format.dateTime(new Date(value), "short");

  const onSubmitHandler = async ({ reason, returnsAt }: ReturnForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          `requests/${request.id}/return`,
        ),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            returnsAt: dayjs(returnsAt)
              .tz(STORE_TIMEZONE)
              .startOf("day")
              .toISOString(),
          }),
        },
      );

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
    <FormBox id="attendance-return-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("parentalReturnHint")}</Alert>
      <Typography>
        {date(request.startsAt)} — {date(request.endsAt)}
      </Typography>
      <DatePicker
        label={tAttendance("returnsAt")}
        onChange={(date) =>
          setValue(
            "returnsAt",
            date?.isValid() ? date.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.returnsAt,
            fullWidth: true,
            helperText: errors.returnsAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={returnsAt ? dayjs(returnsAt) : null}
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

export default ReturnDialog;
