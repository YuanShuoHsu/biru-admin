"use client";

import dayjs, { type Dayjs } from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type LeaveForm, useLeaveFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, ListSubheader, MenuItem, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { statutoryLeaveKindValues } from "@/types/api";
import type {
  AttendanceLeaveCase,
  AttendanceLeaveType,
} from "@/types/attendance";

import {
  attendanceErrorKey,
  attendancePath,
  getStatutoryLeaveName,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const LEAVE_TYPE_GROUPS = ["general", "event", "custom"] as const;

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

  const leaveFormSchema = useLeaveFormSchema(leaveTypes);

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
      reason: "",
      startsAt: dayjs().tz(STORE_TIMEZONE).toISOString(),
    },
    resolver: zodResolver(leaveFormSchema),
  });

  const [endsAt, leaveCaseId, leaveTypeId, startsAt] = useWatch({
    control,
    name: ["endsAt", "leaveCaseId", "leaveTypeId", "startsAt"],
  });

  const leaveTypeGroups = useMemo(() => {
    const available = leaveTypes.filter(({ enabled }) => enabled);

    const matches = {
      general: ({ eventLeave, statutoryKind }: AttendanceLeaveType) =>
        !eventLeave && statutoryKind !== "custom",
      event: ({ eventLeave }: AttendanceLeaveType) => eventLeave,
      custom: ({ statutoryKind }: AttendanceLeaveType) =>
        statutoryKind === "custom",
    };

    return LEAVE_TYPE_GROUPS.map((group) => ({
      group,
      items: available
        .filter(matches[group])
        .sort(
          (first, second) =>
            statutoryLeaveKindValues.indexOf(first.statutoryKind) -
            statutoryLeaveKindValues.indexOf(second.statutoryKind),
        ),
    })).filter(({ items }) => items.length);
  }, [leaveTypes]);

  const leaveType = leaveTypes.find(({ id }) => id === leaveTypeId);

  const isEventLeave = !!leaveType?.eventLeave;

  const date = (value: string) => format.dateTime(new Date(value), "short");

  const handleStartsAtChange = (date: Dayjs | null) => {
    setValue("startsAt", date?.isValid() ? date.toISOString() : "", {
      shouldValidate: isSubmitted,
    });

    if (!date?.isValid() || !startsAt || !endsAt) return;

    const duration = dayjs(endsAt).diff(startsAt);

    if (duration > 0 && !date.isBefore(endsAt))
      setValue("endsAt", date.add(duration, "millisecond").toISOString(), {
        shouldValidate: isSubmitted,
      });
  };

  const onSubmitHandler = async ({ leaveCaseId, ...values }: LeaveForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          kind: "leave",
          ...(isEventLeave ? { leaveCaseId } : {}),
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
        label={tAttendance("leaveType.label")}
        onChange={(event) => {
          setValue("leaveTypeId", event.target.value, {
            shouldValidate: isSubmitted,
          });

          setValue("leaveCaseId", "");
        }}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: () =>
              leaveType ? (
                getStatutoryLeaveName(tAttendance, leaveType)
              ) : (
                <em>{tAttendance("leaveType.placeholder")}</em>
              ),
          },
        }}
        value={leaveTypeId}
      >
        <MenuItem disabled value="">
          <em>{tAttendance("leaveType.placeholder")}</em>
        </MenuItem>
        {leaveTypeGroups.flatMap(({ group, items }) => [
          <ListSubheader key={group}>
            {tAttendance(`leaveTypeGroups.${group}`)}
          </ListSubheader>,
          ...items.map((leaveType) => (
            <MenuItem key={leaveType.id} value={leaveType.id}>
              {getStatutoryLeaveName(tAttendance, leaveType)}
            </MenuItem>
          )),
        ])}
      </TextField>
      {isEventLeave && (
        <TextField
          error={!!errors.leaveCaseId}
          fullWidth
          helperText={errors.leaveCaseId?.message}
          label={tAttendance("leaveCase.label")}
          onChange={(event) =>
            setValue("leaveCaseId", event.target.value, {
              shouldValidate: isSubmitted,
            })
          }
          required
          select
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              displayEmpty: true,
              renderValue: (selected) => {
                const leaveCase = leaveCases.find(({ id }) => id === selected);

                return leaveCase ? (
                  `${leaveCase.reference} · ${date(leaveCase.startsAt)} — ${date(leaveCase.endsAt)}`
                ) : (
                  <em>{tAttendance("leaveCase.placeholder")}</em>
                );
              },
            },
          }}
          value={leaveCaseId}
        >
          <MenuItem disabled value="">
            <em>{tAttendance("leaveCase.placeholder")}</em>
          </MenuItem>
          {leaveCases
            .filter((item) => item.leaveTypeId === leaveTypeId)
            .map(({ endsAt, id, reference, startsAt }) => (
              <MenuItem key={id} value={id}>
                {reference} · {date(startsAt)} — {date(endsAt)}
              </MenuItem>
            ))}
        </TextField>
      )}
      <DateTimePicker
        label={tAttendance("startsAt")}
        onChange={handleStartsAtChange}
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
        label={tAttendance("reason.label")}
        minRows={3}
        multiline
        placeholder={tAttendance("reason.placeholder")}
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default LeaveDialog;
