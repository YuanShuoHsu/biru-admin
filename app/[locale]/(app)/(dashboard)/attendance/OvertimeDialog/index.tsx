"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type OvertimeForm, useOvertimeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

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

interface OvertimeDialogProps {
  mutate: () => void;
  organizationSlug: string;
  shift: AttendanceShift;
}

const OvertimeDialog = ({
  mutate,
  organizationSlug,
  shift,
}: OvertimeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const overtimeFormSchema = useOvertimeFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<OvertimeForm>({
    defaultValues: {
      endsAt:
        shift.dayKind === "workday"
          ? dayjs(shift.endsAt).add(1, "hour").toISOString()
          : shift.endsAt,
      reason: "",
      startsAt: shift.dayKind === "workday" ? shift.endsAt : shift.startsAt,
    },
    resolver: zodResolver(overtimeFormSchema),
  });

  const [endsAt, startsAt] = useWatch({
    control,
    name: ["endsAt", "startsAt"],
  });

  const afterShift = shift.dayKind === "workday";

  const onSubmitHandler = async (values: OvertimeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          kind: "overtime",
          shiftId: shift.id,
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
    <FormBox id="attendance-overtime-form" onSubmit={onSubmit}>
      <Alert severity="info">
        {tAttendance(afterShift ? "overtimeAfterShift" : "overtimeOnShift")}
      </Alert>
      <DateTimePicker
        disabled={afterShift}
        label={tAttendance("startsAt")}
        maxDateTime={endsAt ? dayjs(endsAt) : dayjs(shift.endsAt)}
        minDateTime={dayjs(shift.startsAt)}
        onChange={(date) =>
          setValue("startsAt", date?.isValid() ? date.toISOString() : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.startsAt,
            fullWidth: true,
            helperText: errors.startsAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={startsAt ? dayjs(startsAt) : null}
      />
      <DateTimePicker
        label={tAttendance("endsAt")}
        maxDateTime={afterShift ? undefined : dayjs(shift.endsAt)}
        minDateTime={startsAt ? dayjs(startsAt) : dayjs(shift.startsAt)}
        onChange={(date) =>
          setValue("endsAt", date?.isValid() ? date.toISOString() : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.endsAt,
            fullWidth: true,
            helperText: errors.endsAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={endsAt ? dayjs(endsAt) : null}
      />
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

export default OvertimeDialog;
