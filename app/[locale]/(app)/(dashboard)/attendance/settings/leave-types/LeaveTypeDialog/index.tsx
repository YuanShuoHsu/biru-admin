"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type LeaveTypeForm, useLeaveTypeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceLeaveType } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface LeaveTypeDialogProps {
  leaveType?: AttendanceLeaveType;
  mutate: () => void;
  organizationSlug: string;
}

const LeaveTypeDialog = ({
  leaveType,
  mutate,
  organizationSlug,
}: LeaveTypeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const statutoryPaidPercent = leaveType?.statutoryPaidPercent ?? null;

  const leaveTypeFormSchema = useLeaveTypeFormSchema(statutoryPaidPercent ?? 0);

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<LeaveTypeForm>({
    defaultValues: {
      enabled: leaveType?.enabled ?? true,
      name: leaveType?.name ?? "",
      overridden: leaveType?.paidPercent != null,
      paidPercent: leaveType?.paidPercent ?? statutoryPaidPercent ?? 0,
      requiresBalance: leaveType?.requiresBalance ?? true,
    },
    resolver: zodResolver(leaveTypeFormSchema),
  });

  const [enabled, overridden, paidPercent, requiresBalance] = useWatch({
    control,
    name: ["enabled", "overridden", "paidPercent", "requiresBalance"],
  });

  const onSubmitHandler = async (values: LeaveTypeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          leaveType ? `leave-types/${leaveType.id}` : "leave-types",
        ),
        {
          method: leaveType ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            statutoryPaidPercent === null
              ? {
                  enabled: values.enabled,
                  name: values.name,
                  paidPercent: values.paidPercent,
                  requiresBalance: values.requiresBalance,
                }
              : {
                  enabled: true,
                  name: values.name,
                  paidPercent: values.overridden ? values.paidPercent : null,
                },
          ),
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
    <FormBox id="attendance-leave-type-form" onSubmit={onSubmit}>
      {statutoryPaidPercent !== null && (
        <Alert severity="info">{tAttendance("statutoryHint")}</Alert>
      )}
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tAttendance("name")}
        required
        {...register("name")}
      />
      {statutoryPaidPercent !== null && (
        <>
          <Typography color="text.secondary" variant="body2">
            {tAttendance("statutoryPaidPercent", {
              percent: statutoryPaidPercent,
            })}
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={overridden}
                onChange={(_, checked) => {
                  setValue("overridden", checked);
                  if (!checked) setValue("paidPercent", statutoryPaidPercent);
                }}
              />
            }
            label={tAttendance("aboveStatutory")}
            sx={{ alignSelf: "flex-start" }}
          />
        </>
      )}
      {(statutoryPaidPercent === null || overridden) && (
        <NumberSpinner
          error={!!errors.paidPercent}
          fullWidth
          helperText={errors.paidPercent?.message}
          label={tAttendance("paidPercent")}
          max={100}
          min={statutoryPaidPercent ?? 0}
          onValueChange={(value) =>
            setValue("paidPercent", value ?? statutoryPaidPercent ?? 0, {
              shouldValidate: isSubmitted,
            })
          }
          value={paidPercent}
        />
      )}
      {statutoryPaidPercent === null && (
        <>
          <FormControlLabel
            control={
              <Checkbox
                checked={requiresBalance}
                onChange={(_, checked) => setValue("requiresBalance", checked)}
              />
            }
            label={tAttendance("requiresBalance")}
            sx={{ alignSelf: "flex-start" }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={enabled}
                onChange={(_, checked) => setValue("enabled", checked)}
              />
            }
            label={tAttendance("enabled")}
            sx={{ alignSelf: "flex-start" }}
          />
        </>
      )}
    </FormBox>
  );
};

export default LeaveTypeDialog;
