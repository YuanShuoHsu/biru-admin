"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type TemplateForm, useTemplateFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceDayKindValues } from "@/types/api";
import type { AttendanceEmployee } from "@/types/attendance";

import {
  attendanceErrorKey,
  attendancePath,
  weekdayDate,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface TemplateDialogProps {
  employees: AttendanceEmployee[];
  mutate: () => void;
  organizationSlug: string;
}

const TemplateDialog = ({
  employees,
  mutate,
  organizationSlug,
}: TemplateDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const templateFormSchema = useTemplateFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<TemplateForm>({
    defaultValues: {
      dayKind: "workday",
      employeeId: "",
      endTime: "17:00",
      name: "",
      nextDay: false,
      paidBreak: false,
      startTime: "09:00",
      weekday: 1,
    },
    resolver: zodResolver(templateFormSchema),
  });

  const [dayKind, employeeId, nextDay, paidBreak, weekday] = useWatch({
    control,
    name: ["dayKind", "employeeId", "nextDay", "paidBreak", "weekday"],
  });

  const onSubmitHandler = async (values: TemplateForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "all", "templates"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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
        onChange={(event) =>
          setValue("weekday", Number(event.target.value), {
            shouldValidate: isSubmitted,
          })
        }
        required
        select
        value={weekday}
      >
        {Array.from({ length: 7 }, (_, day) => (
          <MenuItem key={day} value={day}>
            {format.dateTime(weekdayDate(day), { weekday: "long" })}
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
      <FormControlLabel
        control={
          <Checkbox
            checked={nextDay}
            onChange={(_, checked) => setValue("nextDay", checked)}
          />
        }
        label={tAttendance("nextDay")}
        sx={{ alignSelf: "flex-start" }}
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
    </FormBox>
  );
};

export default TemplateDialog;
