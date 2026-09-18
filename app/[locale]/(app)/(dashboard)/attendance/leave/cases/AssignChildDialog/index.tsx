"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type AssignChildForm, useAssignChildFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceLeaveCase,
  AttendanceParentalChild,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface AssignChildDialogProps {
  leaveCase: AttendanceLeaveCase;
  mutate: () => void;
  organizationSlug: string;
  parentalChildren: AttendanceParentalChild[];
}

const AssignChildDialog = ({
  leaveCase,
  mutate,
  organizationSlug,
  parentalChildren,
}: AssignChildDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const assignChildFormSchema = useAssignChildFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<AssignChildForm>({
    defaultValues: { childId: "", reason: "" },
    resolver: zodResolver(assignChildFormSchema),
  });

  const childId = useWatch({ control, name: "childId" });

  const onSubmitHandler = async (values: AssignChildForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "all",
          `leave-cases/${leaveCase.id}/child`,
        ),
        {
          method: "PATCH",
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
    <FormBox id="attendance-assign-child-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("parentalChildHint")}</Alert>
      <TextField
        error={!!errors.childId}
        fullWidth
        helperText={errors.childId?.message}
        label={tAttendance("parentalChild")}
        onChange={(event) =>
          setValue("childId", event.target.value, {
            shouldValidate: isSubmitted,
          })
        }
        required
        select
        value={childId}
      >
        {parentalChildren
          .filter(({ employeeId }) => employeeId === leaveCase.employeeId)
          .map(({ id, label, reference }) => (
            <MenuItem key={id} value={id}>
              {label} · {reference}
            </MenuItem>
          ))}
      </TextField>
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("reason")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default AssignChildDialog;
