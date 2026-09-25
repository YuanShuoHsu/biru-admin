"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { type TemplateForm, useTemplateFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

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

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceScheduledDayKindValues } from "@/types/api";
import type {
  AttendanceEmployee,
  AttendanceTemplate,
} from "@/types/attendance";

import {
  attendanceErrorKey,
  attendancePath,
  weekdayDate,
} from "@/utils/attendance";
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

interface TemplateDialogProps {
  employees: AttendanceEmployee[];
  mutate: () => void;
  openingHours: string;
  organizationSlug: string;
  template?: AttendanceTemplate;
}

const TemplateDialog = ({
  employees,
  mutate,
  openingHours,
  organizationSlug,
  template,
}: TemplateDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const templateFormSchema = useTemplateFormSchema();

  const openingTimesOn = (day: number) => {
    const schedule = getSingleDaySchedule(
      openingHours,
      dayjs().tz(STORE_TIMEZONE).day(day),
    );

    return {
      endTime: schedule?.endTime ?? "",
      startTime: schedule?.startTime ?? "",
    };
  };

  const initialTimes = template ?? openingTimesOn(1);

  const {
    control,
    formState: { dirtyFields, errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<TemplateForm>({
    defaultValues: {
      breaks: template?.breaks ?? [],
      dayKind: template?.dayKind ?? "workday",
      employeeId: template?.employeeId ?? "",
      endTime: initialTimes.endTime,
      name: template?.name ?? "",
      paidBreak: template?.paidBreak ?? false,
      startTime: initialTimes.startTime,
      weekday: template?.weekday ?? 1,
    },
    resolver: zodResolver(templateFormSchema),
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "breaks",
  });

  const [dayKind, employeeId, paidBreak, weekday] = useWatch({
    control,
    name: ["dayKind", "employeeId", "paidBreak", "weekday"],
  });

  const rotating =
    employees.find(({ id }) => id === employeeId)?.regularLeaveWeekday === null;

  const onSubmitHandler = async (values: TemplateForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          template ? `templates/${template.id}` : "templates",
        ),
        {
          method: template ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            dayKind: rotating ? values.dayKind : undefined,
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
    <FormBox id="attendance-template-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tAttendance("name")}
        required
        {...register("name")}
      />
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
      <TextField
        error={!!errors.weekday}
        fullWidth
        helperText={errors.weekday?.message}
        label={tAttendance("weekday")}
        onChange={(event) => {
          const day = Number(event.target.value);

          setValue("weekday", day, { shouldValidate: isSubmitted });

          if (template || dirtyFields.startTime || dirtyFields.endTime) return;

          const times = openingTimesOn(day);

          setValue("startTime", times.startTime);
          setValue("endTime", times.endTime);
        }}
        required
        select
        value={weekday}
      >
        {Array.from({ length: 7 }, (_, day) => (
          <MenuItem key={day} value={day}>
            {format.dateTime(weekdayDate(day), "weekdayLong")}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.startTime}
        fullWidth
        helperText={errors.startTime?.message}
        label={tAttendance("startsAt")}
        type="time"
        {...register("startTime")}
      />
      <TextField
        error={!!errors.endTime}
        fullWidth
        helperText={errors.endTime?.message}
        label={tAttendance("endsAt")}
        type="time"
        {...register("endTime")}
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
    </FormBox>
  );
};

export default TemplateDialog;
