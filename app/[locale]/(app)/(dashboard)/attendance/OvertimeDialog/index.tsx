"use client";

import dayjs, { type Dayjs } from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type OvertimeForm, useOvertimeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { MAX_DAILY_WORK_HOURS } from "@/constants/attendance";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceShift } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";
import { scheduledHours } from "@/utils/scheduledHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

type OvertimePosition = "before" | "after";

const earlier = (a: Dayjs, b: Dayjs) => (a.isBefore(b) ? a : b);

const later = (a: Dayjs, b: Dayjs) => (a.isAfter(b) ? a : b);

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

  const workday = shift.dayKind === "workday";

  const workdayOvertimeHours =
    MAX_DAILY_WORK_HOURS - scheduledHours(shift, -Infinity, Infinity);

  const earliestStart = dayjs(shift.startsAt).subtract(
    workdayOvertimeHours,
    "hour",
  );

  const latestEnd = dayjs(shift.endsAt).add(workdayOvertimeHours, "hour");

  const earlyClockIn =
    shift.clockInAt && dayjs(shift.clockInAt).isBefore(shift.startsAt)
      ? later(dayjs(shift.clockInAt), earliestStart).toISOString()
      : "";

  const lateClockOut =
    shift.clockOutAt && dayjs(shift.clockOutAt).isAfter(shift.endsAt)
      ? earlier(dayjs(shift.clockOutAt), latestEnd).toISOString()
      : "";

  const [position, setPosition] = useState<OvertimePosition>(
    earlyClockIn && !lateClockOut ? "before" : "after",
  );

  const workdayInterval = (value: OvertimePosition) =>
    value === "after"
      ? { startsAt: shift.endsAt, endsAt: lateClockOut }
      : { startsAt: earlyClockIn, endsAt: shift.startsAt };

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<OvertimeForm>({
    defaultValues: {
      ...(workday
        ? workdayInterval(position)
        : {
            startsAt: shift.startsAt,
            endsAt:
              shift.dayKind === "regularLeave"
                ? shift.endsAt
                : earlier(
                    dayjs(shift.endsAt),
                    dayjs(shift.startsAt).add(MAX_DAILY_WORK_HOURS, "hour"),
                  ).toISOString(),
          }),
      reason: "",
    },
    resolver: zodResolver(overtimeFormSchema),
  });

  const [endsAt, startsAt] = useWatch({
    control,
    name: ["endsAt", "startsAt"],
  });

  const dailyCapped = shift.dayKind !== "regularLeave";

  const startsAtMin = workday
    ? earliestStart
    : dailyCapped && endsAt
      ? later(
          dayjs(shift.startsAt),
          dayjs(endsAt).subtract(MAX_DAILY_WORK_HOURS, "hour"),
        )
      : dayjs(shift.startsAt);

  const endsAtMax = workday
    ? latestEnd
    : dailyCapped && startsAt
      ? earlier(
          dayjs(shift.endsAt),
          dayjs(startsAt).add(MAX_DAILY_WORK_HOURS, "hour"),
        )
      : dayjs(shift.endsAt);

  const handlePositionChange = (value: OvertimePosition | null) => {
    if (!value) return;

    setPosition(value);

    const { endsAt, startsAt } = workdayInterval(value);

    setValue("startsAt", startsAt, { shouldValidate: isSubmitted });
    setValue("endsAt", endsAt, { shouldValidate: isSubmitted });
  };

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
        {tAttendance(workday ? "overtimeOnWorkday" : "overtimeOnShift")}
      </Alert>
      {workday && (
        <ToggleButtonGroup
          exclusive
          fullWidth
          onChange={(_, value: OvertimePosition | null) =>
            handlePositionChange(value)
          }
          size="small"
          value={position}
        >
          {(["before", "after"] as const).map((value) => (
            <ToggleButton key={value} value={value}>
              {tAttendance(`overtimePosition.${value}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
      <DateTimePicker
        disabled={workday && position === "after"}
        label={tAttendance("startsAt")}
        maxDateTime={endsAt ? dayjs(endsAt) : dayjs(shift.endsAt)}
        minDateTime={startsAtMin}
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
        disabled={workday && position === "before"}
        label={tAttendance("endsAt")}
        maxDateTime={endsAtMax}
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
