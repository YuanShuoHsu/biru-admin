"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { type TransitionForm, useTransitionFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { useMonthFormat } from "@/hooks/useMonthFormat";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { PayrollStatement } from "@/types/attendance";

import { attendanceErrorKey, payrollPath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface TransitionDialogProps {
  action: "publish" | "review";
  mutate: () => void;
  organizationSlug: string;
  statement: PayrollStatement;
}

const TransitionDialog = ({
  action,
  mutate,
  organizationSlug,
  statement,
}: TransitionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const monthFormat = useMonthFormat();

  const transitionFormSchema = useTransitionFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<TransitionForm>({
    defaultValues: { reason: "" },
    resolver: zodResolver(transitionFormSchema),
  });

  const onSubmitHandler = async (values: TransitionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        payrollPath(
          organizationSlug,
          "org",
          `statements/${statement.id}/${action}`,
        ),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      enqueueSnackbar(
        tAttendance(
          action === "publish" ? "payroll.published" : "payroll.reviewed",
          {
            month: dayjs(statement.month).format(monthFormat),
            name: statement.employeeName,
          },
        ),
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
    <FormBox id="payroll-transition-form" onSubmit={onSubmit}>
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

export default TransitionDialog;
