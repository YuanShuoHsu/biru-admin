"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type TemplateForm, useTemplateFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceDayKindValues } from "@/types/api";
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

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

interface TemplateDialogProps {
  employees: AttendanceEmployee[];
  mutate: () => void;
  organizationSlug: string;
  template?: AttendanceTemplate;
}

const TemplateDialog = ({
  employees,
  mutate,
  organizationSlug,
  template,
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
      dayKind: template?.dayKind ?? "workday",
      employeeId: template?.employeeId ?? "",
      endTime: template?.endTime ?? "17:00",
      name: template?.name ?? "",
      nextDay: template?.nextDay ?? false,
      paidBreak: template?.paidBreak ?? false,
      startTime: template?.startTime ?? "09:00",
      weekday: template?.weekday ?? 1,
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

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          template ? `templates/${template.id}` : "templates",
        ),
        {
          method: template ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
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
      <StyledFormControlLabel
        control={
          <Checkbox
            checked={nextDay}
            onChange={(_, checked) => setValue("nextDay", checked)}
          />
        }
        label={tAttendance("nextDay")}
      />
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
    </FormBox>
  );
};

export default TemplateDialog;
