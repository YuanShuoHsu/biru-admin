"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type ReturnReviewForm,
  useReturnReviewFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField, Typography } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceParentalReturn } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface ReturnReviewDialogProps {
  mutate: () => void;
  organizationSlug: string;
  parentalReturn: AttendanceParentalReturn;
  status: "approved" | "rejected";
}

const ReturnReviewDialog = ({
  mutate,
  organizationSlug,
  parentalReturn,
  status,
}: ReturnReviewDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const returnReviewFormSchema = useReturnReviewFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ReturnReviewForm>({
    defaultValues: { reason: "" },
    resolver: zodResolver(returnReviewFormSchema),
  });

  const date = (value: string) => format.dateTime(new Date(value), "date");

  const onSubmitHandler = async (values: ReturnReviewForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          `return-requests/${parentalReturn.id}/review`,
        ),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, status }),
        },
      );

      enqueueSnackbar(
        tAttendance(`parentalReturns.${status}`, {
          name: parentalReturn.employeeName,
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
    <FormBox id="attendance-return-review-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("parentalReturnHint")}</Alert>
      <Typography>
        {parentalReturn.employeeName} · {tAttendance("returnsAt")}:{" "}
        {date(parentalReturn.returnsAt)} · {parentalReturn.reason}
      </Typography>
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("reviewReason")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default ReturnReviewDialog;
