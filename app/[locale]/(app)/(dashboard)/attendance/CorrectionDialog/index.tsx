"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type CorrectionForm, useCorrectionFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { CORRECTION_LEAD_HOURS } from "@/constants/attendance";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceShift } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface CorrectionDialogProps {
  mutate: () => void;
  organizationSlug: string;
  shift: AttendanceShift;
}

const CorrectionDialog = ({
  mutate,
  organizationSlug,
  shift,
}: CorrectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const correctionFormSchema = useCorrectionFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<CorrectionForm>({
    defaultValues: {
      clockInAt:
        shift.events.find(({ action }) => action === "clockIn")?.occurredAt ??
        shift.startsAt,
      clockOutAt:
        shift.events.find(({ action }) => action === "clockOut")?.occurredAt ??
        shift.endsAt,
      reason: "",
    },
    resolver: zodResolver(correctionFormSchema),
  });

  const [clockInAt, clockOutAt] = useWatch({
    control,
    name: ["clockInAt", "clockOutAt"],
  });

  const earliest = dayjs(shift.startsAt).subtract(
    CORRECTION_LEAD_HOURS,
    "hour",
  );

  const latest = dayjs(shift.endsAt).add(1, "day");

  const onSubmitHandler = async ({
    clockInAt,
    clockOutAt,
    reason,
  }: CorrectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "correction",
          shiftId: shift.id,
          reason,
          correctedEvents: [
            { action: "clockIn", occurredAt: clockInAt },
            { action: "clockOut", occurredAt: clockOutAt },
          ],
          startsAt: clockInAt,
          endsAt: clockOutAt,
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
    <FormBox id="attendance-correction-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("correctionHint")}</Alert>
      {(
        [
          ["clockInAt", clockInAt, "clockIn"],
          ["clockOutAt", clockOutAt, "clockOut"],
        ] as const
      ).map(([name, value, action]) => (
        <DateTimePicker
          disableFuture
          key={name}
          label={tAttendance(`eventAction.options.${action}`)}
          maxDateTime={latest}
          minDateTime={earliest}
          onChange={(date) =>
            setValue(name, date?.isValid() ? date.toISOString() : "", {
              shouldValidate: isSubmitted,
            })
          }
          slotProps={{
            textField: {
              error: !!errors[name],
              fullWidth: true,
              helperText: errors[name]?.message,
            },
          }}
          timezone={STORE_TIMEZONE}
          value={value ? dayjs(value) : null}
        />
      ))}
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("reason")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default CorrectionDialog;
