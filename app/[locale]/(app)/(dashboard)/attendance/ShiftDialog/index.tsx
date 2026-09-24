"use client";

import dayjs, { type Dayjs } from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { type ShiftForm, useShiftFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Add, Delete } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceDayKindValues } from "@/types/api";
import type { AttendanceEmployee } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";
import { getSingleDaySchedule } from "@/utils/openingHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

const StyledStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
}));

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const atTimeAfter = (from: Dayjs, time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  const candidate = from.hour(hour).minute(minute).second(0).millisecond(0);

  return candidate.isBefore(from) ? candidate.add(1, "day") : candidate;
};

interface ShiftDialogProps {
  date?: string;
  employeeId?: string;
  employees: AttendanceEmployee[];
  mutate: () => void;
  openingHours: string;
  organizationSlug: string;
}

const ShiftDialog = ({
  date: initialDate,
  employeeId: initialEmployeeId,
  employees,
  mutate,
  openingHours,
  organizationSlug,
}: ShiftDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

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

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ShiftForm>({
    defaultValues: {
      breaks: [],
      dayKind: "workday",
      employeeId: initialEmployeeId ?? "",
      endsAt: closesAt?.toISOString() ?? "",
      paidBreak: false,
      repeatWeeks: 1,
      startsAt: opensAt?.toISOString() ?? "",
    },
    resolver: zodResolver(shiftFormSchema),
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "breaks",
  });

  const [dayKind, employeeId, endsAt, paidBreak, repeatWeeks, startsAt] =
    useWatch({
      control,
      name: [
        "dayKind",
        "employeeId",
        "endsAt",
        "paidBreak",
        "repeatWeeks",
        "startsAt",
      ],
    });

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

  const onSubmitHandler = async ({
    breaks,
    repeatWeeks,
    ...values
  }: ShiftForm) => {
    const shiftStart = dayjs(values.startsAt).tz(STORE_TIMEZONE);
    const breakWindows = breaks.map(({ startTime, endTime }) => {
      const breakStart = atTimeAfter(shiftStart, startTime);

      return { startsAt: breakStart, endsAt: atTimeAfter(breakStart, endTime) };
    });

    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "shifts"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shifts: Array.from({ length: repeatWeeks }, (_, index) => ({
            ...values,
            startsAt: dayjs(values.startsAt)
              .add(index * 7, "day")
              .toISOString(),
            endsAt: dayjs(values.endsAt)
              .add(index * 7, "day")
              .toISOString(),
            breaks: breakWindows.map((window) => ({
              startsAt: window.startsAt.add(index * 7, "day").toISOString(),
              endsAt: window.endsAt.add(index * 7, "day").toISOString(),
            })),
          })),
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
    <FormBox id="attendance-shift-form" onSubmit={onSubmit}>
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
      {fields.map(({ id }, index) => (
        <StyledStack direction="row" key={id}>
          <TextField
            error={!!errors.breaks?.[index]?.startTime}
            fullWidth
            helperText={errors.breaks?.[index]?.startTime?.message}
            label={tAttendance("breakStartTime")}
            type="time"
            {...register(`breaks.${index}.startTime`)}
          />
          <TextField
            error={!!errors.breaks?.[index]?.endTime}
            fullWidth
            helperText={errors.breaks?.[index]?.endTime?.message}
            label={tAttendance("breakEndTime")}
            type="time"
            {...register(`breaks.${index}.endTime`)}
          />
          <IconButton color="error" onClick={() => remove(index)} size="small">
            <Delete fontSize="small" />
          </IconButton>
        </StyledStack>
      ))}
      <StyledButton
        onClick={() => append({ startTime: "", endTime: "" })}
        size="small"
        startIcon={<Add />}
      >
        {tAttendance("addBreak")}
      </StyledButton>
      <StyledFormControlLabel
        control={
          <Checkbox
            checked={paidBreak}
            onChange={(_, checked) => setValue("paidBreak", checked)}
          />
        }
        label={tAttendance("paidBreak")}
      />
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
        {attendanceDayKindValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`dayKind.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
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
    </FormBox>
  );
};

export default ShiftDialog;
