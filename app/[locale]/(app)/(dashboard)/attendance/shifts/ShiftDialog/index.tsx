"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type ShiftForm, useShiftFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceDayKindValues } from "@/types/api";
import type { AttendanceEmployee } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface ShiftDialogProps {
  employees: AttendanceEmployee[];
  mutate: () => void;
  organizationSlug: string;
}

const ShiftDialog = ({
  employees,
  mutate,
  organizationSlug,
}: ShiftDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const shiftFormSchema = useShiftFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ShiftForm>({
    defaultValues: {
      dayKind: "workday",
      employeeId: "",
      endsAt: dayjs()
        .tz(STORE_TIMEZONE)
        .add(1, "day")
        .hour(17)
        .minute(0)
        .second(0)
        .toISOString(),
      paidBreak: false,
      repeatWeeks: 1,
      startsAt: dayjs()
        .tz(STORE_TIMEZONE)
        .add(1, "day")
        .hour(9)
        .minute(0)
        .second(0)
        .toISOString(),
    },
    resolver: zodResolver(shiftFormSchema),
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

  const onSubmitHandler = async ({ repeatWeeks, ...values }: ShiftForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "all", "shifts"), {
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
      <FormControlLabel
        control={
          <Checkbox
            checked={paidBreak}
            onChange={(_, checked) => setValue("paidBreak", checked)}
          />
        }
        label={tAttendance("paidBreak")}
        sx={{ alignSelf: "flex-start" }}
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
