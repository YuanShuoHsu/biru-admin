"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { type DeferralForm, useDeferralFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceLeaveBalance } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface DeferralDialogProps {
  balance: AttendanceLeaveBalance;
  mutate: () => void;
  organizationSlug: string;
}

const DeferralDialog = ({
  balance,
  mutate,
  organizationSlug,
}: DeferralDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const deferralFormSchema = useDeferralFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<DeferralForm>({
    defaultValues: { reason: "" },
    resolver: zodResolver(deferralFormSchema),
  });

  const onSubmitHandler = async ({ reason }: DeferralForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(organizationSlug, "org", "annual-leave-deferrals"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: balance.employeeId,
            periodStart: balance.startsAt,
            reason,
          }),
        },
      );

      enqueueSnackbar(
        tAttendance("balances.deferralRecorded", {
          name: balance.employeeName,
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
    <FormBox id="attendance-deferral-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("balances.deferralReason")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default DeferralDialog;
