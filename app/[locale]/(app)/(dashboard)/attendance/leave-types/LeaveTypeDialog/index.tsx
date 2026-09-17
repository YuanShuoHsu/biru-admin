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
  MenuItem,
  TextField,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { statutoryLeaveKindValues } from "@/types/api";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface LeaveTypeDialogProps {
  mutate: () => void;
  organizationSlug: string;
}

const LeaveTypeDialog = ({
  mutate,
  organizationSlug,
}: LeaveTypeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const leaveTypeFormSchema = useLeaveTypeFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<LeaveTypeForm>({
    defaultValues: {
      enabled: true,
      name: "",
      paidPercent: 0,
      requiresBalance: true,
      statutoryKind: "custom",
    },
    resolver: zodResolver(leaveTypeFormSchema),
  });

  const [enabled, paidPercent, requiresBalance, statutoryKind] = useWatch({
    control,
    name: ["enabled", "paidPercent", "requiresBalance", "statutoryKind"],
  });

  const onSubmitHandler = async (values: LeaveTypeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "all", "leave-types"), {
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
    <FormBox id="attendance-leave-type-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("statutoryHint")}</Alert>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tAttendance("name")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.statutoryKind}
        fullWidth
        helperText={errors.statutoryKind?.message}
        label={tAttendance("statutoryKind.label")}
        required
        select
        value={statutoryKind}
        {...register("statutoryKind")}
      >
        {statutoryLeaveKindValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`statutoryKind.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <NumberSpinner
        error={!!errors.paidPercent}
        fullWidth
        helperText={errors.paidPercent?.message}
        label={tAttendance("paidPercent")}
        max={100}
        min={0}
        onValueChange={(value) =>
          setValue("paidPercent", value ?? 0, { shouldValidate: isSubmitted })
        }
        value={paidPercent}
      />
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
    </FormBox>
  );
};

export default LeaveTypeDialog;
