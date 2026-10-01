"use client";

import dayjs, { type Dayjs } from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type ShiftForm, useShiftFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { EventBusy } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceScheduledDayKindValues } from "@/types/api";
import type {
  AttendanceEmployee,
  AttendanceShift,
  AttendanceShiftType,
  AttendanceTeam,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";
import { getSingleDaySchedule } from "@/utils/openingHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

const StartButton = styled(Button)({
  alignSelf: "flex-start",
});

const ChipStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(1),
}));

const RECENT_TIMES_LIMIT = 4;

const VALIDATION_DELAY_MS = 400;

const atTimeAfter = (from: Dayjs, time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const candidate = from.hour(hour).minute(minute).second(0).millisecond(0);

  return candidate.isBefore(from) ? candidate.add(1, "day") : candidate;
};

const storeTime = (value: string) =>
  dayjs(value).tz(STORE_TIMEZONE).format("HH:mm");

export type ShiftChange = Pick<
  AttendanceShift,
  "employeeId" | "endsAt" | "paidBreak" | "startsAt"
> & {
  dayKind?: (typeof attendanceScheduledDayKindValues)[number];
  teamId?: string | null;
};

interface ShiftDialogProps {
  date?: string;
  employeeId?: string;
  employees: AttendanceEmployee[];
  mutate: () => void;
  onCancelShift?: (shift: AttendanceShift) => void;
  onUpdateShift?: (
    shift: AttendanceShift,
    change: ShiftChange,
  ) => Promise<boolean>;
  openingHours: string;
  organizationSlug: string;
  recentShifts?: AttendanceShift[];
  shift?: AttendanceShift;
  shiftTypes: AttendanceShiftType[];
  teams: AttendanceTeam[];
}

const ShiftDialog = ({
  date: initialDate,
  employeeId: initialEmployeeId,
  employees,
  mutate,
  onCancelShift,
  onUpdateShift,
  openingHours,
  organizationSlug,
  recentShifts = [],
  shift,
  shiftTypes,
  teams,
}: ShiftDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const shiftFormSchema = useShiftFormSchema();

  const day = initialDate
    ? dayjs(initialDate).tz(STORE_TIMEZONE)
    : dayjs().tz(STORE_TIMEZONE).add(1, "day");

  const schedule = getSingleDaySchedule(openingHours, day);
  const opensAt =
    schedule && atTimeAfter(day.startOf("day"), schedule.startTime);
  const closesAt =
    schedule && opensAt && atTimeAfter(opensAt, schedule.endTime);

  const sharedTeams = (ids: string[]) =>
    teams.filter(({ employeeIds }) =>
      ids.every((id) => employeeIds.includes(id)),
    );

  const soleTeamId = (ids: string[]) => {
    const shared = ids.length ? sharedTeams(ids) : [];

    return shared.length === 1 ? shared[0].id : "";
  };

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ShiftForm>({
    defaultValues: shift
      ? {
          dayKind: shift.dayKind === "holiday" ? "workday" : shift.dayKind,
          employeeIds: [shift.employeeId],
          endsAt: shift.endsAt,
          paidBreak: shift.paidBreak,
          repeatWeeks: 1,
          startsAt: shift.startsAt,
          teamId: shift.teamId ?? "",
        }
      : {
          dayKind: "workday",
          employeeIds: initialEmployeeId ? [initialEmployeeId] : [],
          endsAt: closesAt?.toISOString() ?? "",
          paidBreak: false,
          repeatWeeks: 1,
          startsAt: opensAt?.toISOString() ?? "",
          teamId: soleTeamId(initialEmployeeId ? [initialEmployeeId] : []),
        },
    resolver: zodResolver(shiftFormSchema),
  });

  const values = useWatch({ control });

  const {
    dayKind,
    employeeIds = [],
    endsAt,
    paidBreak,
    repeatWeeks,
    startsAt,
    teamId,
  } = values;

  const rotatingIds = new Set(
    employees
      .filter(({ regularLeaveWeekday }) => regularLeaveWeekday === null)
      .map(({ id }) => id),
  );

  const rotating = employeeIds.some((id) => rotatingIds.has(id));

  const timePresets = useMemo(() => {
    if (shiftTypes.length)
      return shiftTypes.map(({ endTime, name, startTime }) => ({
        label: `${name} ${startTime}–${endTime}`,
        time: [startTime, endTime] as [string, string],
      }));

    const counts = new Map<string, number>();

    for (const { endsAt, startsAt, status } of recentShifts) {
      if (status === "cancelled") continue;

      const key = `${storeTime(startsAt)}-${storeTime(endsAt)}`;

      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts]
      .sort(([, a], [, b]) => b - a)
      .slice(0, RECENT_TIMES_LIMIT)
      .map(([key]) => {
        const time = key.split("-") as [string, string];

        return { label: time.join("–"), time };
      });
  }, [recentShifts, shiftTypes]);

  const [conflict, setConflict] = useState<string>();

  const buildRequest = ({
    dayKind,
    employeeIds,
    endsAt,
    paidBreak,
    repeatWeeks,
    startsAt,
    teamId,
  }: ShiftForm) =>
    shift
      ? {
          body: {
            dayKind: rotatingIds.has(employeeIds[0]) ? dayKind : undefined,
            employeeId: employeeIds[0],
            endsAt,
            paidBreak,
            startsAt,
            teamId: teamId || null,
          } satisfies ShiftChange,
          method: "PATCH",
          url: `${attendancePath(organizationSlug, "org", "shifts")}/${shift.id}`,
        }
      : {
          body: {
            shifts: employeeIds.flatMap((employeeId) =>
              Array.from({ length: repeatWeeks }, (_, index) => ({
                dayKind: rotatingIds.has(employeeId) ? dayKind : undefined,
                employeeId,
                endsAt: dayjs(endsAt)
                  .add(index * 7, "day")
                  .toISOString(),
                paidBreak,
                startsAt: dayjs(startsAt)
                  .add(index * 7, "day")
                  .toISOString(),
                teamId: teamId || null,
              })),
            ),
          },
          method: "POST",
          url: attendancePath(organizationSlug, "org", "shifts"),
        };

  const request = (() => {
    const parsed = shiftFormSchema.safeParse(values);

    return parsed.success ? buildRequest(parsed.data) : undefined;
  })();

  const requestKey = request && JSON.stringify(request);

  useEffect(() => {
    if (!requestKey) return;

    const { body, method, url } = JSON.parse(requestKey) as NonNullable<
      typeof request
    >;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        await fetcher(url, {
          body: JSON.stringify({ ...body, dryRun: true }),
          headers: { "Content-Type": "application/json" },
          method,
          signal: controller.signal,
        });

        setConflict(undefined);
      } catch (error) {
        if (!controller.signal.aborted)
          setConflict(tAttendance(attendanceErrorKey(error)));
      }
    }, VALIDATION_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, tAttendance]);

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

  const handleEmployeeIdsChange = (ids: string[]) => {
    setValue("employeeIds", ids, { shouldValidate: isSubmitted });

    if (!sharedTeams(ids).some(({ id }) => id === teamId))
      setValue("teamId", soleTeamId(ids));
  };

  const handleTimePreset = ([start, end]: [string, string]) => {
    const base = (startsAt ? dayjs(startsAt).tz(STORE_TIMEZONE) : day).startOf(
      "day",
    );
    const nextStartsAt = atTimeAfter(base, start);

    setValue("startsAt", nextStartsAt.toISOString(), {
      shouldValidate: isSubmitted,
    });
    setValue("endsAt", atTimeAfter(nextStartsAt, end).toISOString(), {
      shouldValidate: isSubmitted,
    });
  };

  const employeeNames = (ids: string[]) =>
    format.list(
      ids.map(
        (id) => employees.find((employee) => employee.id === id)?.name ?? "",
      ),
      "enumeration",
    );

  const onSubmitHandler = async (form: ShiftForm) => {
    setDialog({ confirmLoading: true });

    if (shift && onUpdateShift) {
      const { body } = buildRequest(form) as { body: ShiftChange };

      if (await onUpdateShift(shift, body)) closeDialog();
      else setDialog({ confirmLoading: false });

      return;
    }

    try {
      const { body, method, url } = buildRequest(form);

      await fetcher(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      enqueueSnackbar(
        tAttendance("schedule.shiftCreated", {
          count: form.repeatWeeks * form.employeeIds.length,
          name: employeeNames(form.employeeIds),
        }),
        { variant: "success" },
      );

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
    <FormBox id="attendance-shift-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.employeeIds}
        fullWidth
        helperText={errors.employeeIds?.message}
        label={tAttendance("employee")}
        onChange={(event) => {
          const { value } = event.target as { value: string | string[] };

          handleEmployeeIdsChange(Array.isArray(value) ? value : [value]);
        }}
        required
        select
        slotProps={{
          select: {
            multiple: !shift,
            renderValue: (selected) =>
              employeeNames(Array.isArray(selected) ? selected : [selected]),
          },
        }}
        value={shift ? (employeeIds[0] ?? "") : employeeIds}
      >
        {employees.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      {!!teams.length && (
        <TextField
          fullWidth
          label={tAttendance("team")}
          onChange={(event) => setValue("teamId", event.target.value)}
          select
          slotProps={{
            inputLabel: { shrink: true },
            select: { displayEmpty: true },
          }}
          value={teamId}
        >
          <MenuItem value="">{tAttendance("noTeam")}</MenuItem>
          {sharedTeams(employeeIds).map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      )}
      {!!timePresets.length && (
        <ChipStack direction="row">
          <Typography color="textSecondary" variant="body2">
            {tAttendance(
              shiftTypes.length ? "shiftTypes.label" : "schedule.recentTimes",
            )}
          </Typography>
          {timePresets.map(({ label, time }) => (
            <Chip
              key={label}
              label={label}
              onClick={() => handleTimePreset(time)}
              size="small"
              variant="outlined"
            />
          ))}
        </ChipStack>
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
      <StyledFormControlLabel
        control={
          <Checkbox
            checked={!!paidBreak}
            onChange={(_, checked) => setValue("paidBreak", checked)}
          />
        }
        label={tAttendance("paidBreak")}
      />
      {rotating && (
        <TextField
          error={!!errors.dayKind}
          fullWidth
          helperText={errors.dayKind?.message}
          label={tAttendance("dayKind.label")}
          required
          select
          value={dayKind}
          {...register("dayKind")}
        >
          {attendanceScheduledDayKindValues.map((value) => (
            <MenuItem key={value} value={value}>
              {tAttendance(`dayKind.options.${value}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
      {!shift && (
        <NumberSpinner
          error={!!errors.repeatWeeks}
          fullWidth
          helperText={errors.repeatWeeks?.message}
          label={tAttendance("repeatWeeks")}
          max={12}
          min={1}
          onValueChange={(value) =>
            setValue("repeatWeeks", value ?? 1, { shouldValidate: isSubmitted })
          }
          value={repeatWeeks}
        />
      )}
      {request && conflict && <FormHelperText error>{conflict}</FormHelperText>}
      {shift && onCancelShift && (
        <StartButton
          color="error"
          onClick={() => {
            closeDialog();
            onCancelShift(shift);
          }}
          startIcon={<EventBusy />}
        >
          {tAttendance("cancelShift")}
        </StartButton>
      )}
    </FormBox>
  );
};

export default ShiftDialog;
