"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type LeaveForm, useLeaveFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, MenuItem, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceParentalModeValues } from "@/types/api";
import type {
  AttendanceLeaveCase,
  AttendanceLeaveType,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface LeaveDialogProps {
  leaveCases: AttendanceLeaveCase[];
  leaveTypes: AttendanceLeaveType[];
  mutate: () => void;
  organizationSlug: string;
}

const LeaveDialog = ({
  leaveCases,
  leaveTypes,
  mutate,
  organizationSlug,
}: LeaveDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const leaveFormSchema = useLeaveFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<LeaveForm>({
    defaultValues: {
      endsAt: dayjs().tz(STORE_TIMEZONE).add(1, "hour").toISOString(),
      leaveCaseId: "",
      leaveTypeId: "",
      parentalMode: "",
      reason: "",
      startsAt: dayjs().tz(STORE_TIMEZONE).toISOString(),
    },
    resolver: zodResolver(leaveFormSchema),
  });

  const [endsAt, leaveCaseId, leaveTypeId, parentalMode, startsAt] = useWatch({
    control,
    name: ["endsAt", "leaveCaseId", "leaveTypeId", "parentalMode", "startsAt"],
  });

  const leaveType = leaveTypes.find(({ id }) => id === leaveTypeId);

  const isEventLeave = !!leaveType?.eventLeave;

  const isParentalLeave = leaveType?.statutoryKind === "parental";

  const date = (value: string) => format.dateTime(new Date(value), "short");

  const onSubmitHandler = async ({
    leaveCaseId,
    parentalMode,
    ...values
  }: LeaveForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "all", "requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          kind: "leave",
          ...(isEventLeave && leaveCaseId ? { leaveCaseId } : {}),
          ...(isParentalLeave && parentalMode ? { parentalMode } : {}),
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
    <FormBox id="attendance-leave-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("leaveRequestHint")}</Alert>
      <TextField
        error={!!errors.leaveTypeId}
        fullWidth
        helperText={errors.leaveTypeId?.message}
        label={tAttendance("leaveType")}
        onChange={(event) => {
          setValue("leaveTypeId", event.target.value, {
            shouldValidate: isSubmitted,
          });

          setValue("leaveCaseId", "");
          setValue("parentalMode", "");
        }}
        required
        select
        value={leaveTypeId}
      >
        {leaveTypes
          .filter(({ enabled }) => enabled)
          .map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
      </TextField>
      {isEventLeave && (
        <TextField
          error={!!errors.leaveCaseId}
          fullWidth
          helperText={errors.leaveCaseId?.message}
          label={tAttendance("leaveCase")}
          onChange={(event) =>
            setValue("leaveCaseId", event.target.value, {
              shouldValidate: isSubmitted,
            })
          }
          select
          value={leaveCaseId}
        >
          <MenuItem value="">—</MenuItem>
          {leaveCases
            .filter((item) => item.leaveTypeId === leaveTypeId)
            .map(({ endsAt, id, reference, startsAt }) => (
              <MenuItem key={id} value={id}>
                {reference} · {date(startsAt)} — {date(endsAt)}
              </MenuItem>
            ))}
        </TextField>
      )}
      {isParentalLeave && (
        <TextField
          error={!!errors.parentalMode}
          fullWidth
          helperText={errors.parentalMode?.message}
          label={tAttendance("parentalMode")}
          required
          select
          value={parentalMode}
          {...register("parentalMode")}
        >
          {attendanceParentalModeValues.map((value) => (
            <MenuItem key={value} value={value}>
              {tAttendance(
                value === "daily" ? "parentalDaily" : "parentalContinuous",
              )}
            </MenuItem>
          ))}
        </TextField>
      )}
      <DateTimePicker
        label={tAttendance("startsAt")}
        maxDateTime={endsAt ? dayjs(endsAt) : undefined}
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
        minDateTime={startsAt ? dayjs(startsAt) : undefined}
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

export default LeaveDialog;
