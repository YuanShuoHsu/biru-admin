"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { type CancelShiftForm, useCancelShiftFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField, Typography } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceShift } from "@/types/attendance";

import {
  attendanceErrorKey,
  attendancePath,
  formatScheduledShift,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface CancelShiftDialogProps {
  onCancelled: () => void;
  organizationSlug: string;
  shift: AttendanceShift;
}

const CancelShiftDialog = ({
  onCancelled,
  organizationSlug,
  shift,
}: CancelShiftDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

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

  const onSubmitHandler = async (values: CancelShiftForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        `${attendancePath(organizationSlug, "org", "shifts")}/${shift.id}/cancel`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      closeDialog();

      onCancelled();
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
