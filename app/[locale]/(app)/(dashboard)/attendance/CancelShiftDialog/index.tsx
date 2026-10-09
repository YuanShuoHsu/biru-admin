"use client";

import { useFormatter, useTranslations } from "next-intl";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { type CancelShiftForm, useCancelShiftFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField, Typography } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceShift } from "@/types/attendance";

import { formatScheduledShift } from "@/utils/attendance";

interface CancelShiftDialogProps {
  onConfirm: (reason: string) => Promise<void>;
  shift: AttendanceShift;
}

const CancelShiftDialog = ({ onConfirm, shift }: CancelShiftDialogProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const cancelShiftFormSchema = useCancelShiftFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CancelShiftForm>({
    defaultValues: { reason: "" },
    resolver: zodResolver(cancelShiftFormSchema),
  });

  const onSubmitHandler = async ({ reason }: CancelShiftForm) => {
    setDialog({ confirmLoading: true });

    await onConfirm(reason);

    setDialog({ confirmLoading: false });
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-cancel-shift-form" onSubmit={onSubmit}>
      <Typography>
        {shift.employeeName} · {formatScheduledShift(format, shift)}
      </Typography>
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("cancelReason")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default CancelShiftDialog;
