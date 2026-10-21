"use client";

import { useTranslations } from "next-intl";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import FormBox from "@/components/FormBox";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceScheduledDayKindValues } from "@/types/api";

interface DayKindForm {
  dayKind: (typeof attendanceScheduledDayKindValues)[number];
}

interface DayKindDialogProps {
  defaultValue: DayKindForm["dayKind"];
  onSubmit: (dayKind: DayKindForm["dayKind"]) => Promise<void>;
}

const DayKindDialog = ({ defaultValue, onSubmit }: DayKindDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const { control, handleSubmit, register } = useForm<DayKindForm>({
    defaultValues: { dayKind: defaultValue },
  });

  const dayKind = useWatch({ control, name: "dayKind" });

  const onSubmitHandler = async ({ dayKind }: DayKindForm) => {
    setDialog({ confirmLoading: true });

    await onSubmit(dayKind);

    closeDialog();
  };

  const onFormSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-shift-day-kind-form" onSubmit={onFormSubmit}>
      <TextField
        fullWidth
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
    </FormBox>
  );
};

export default DayKindDialog;
