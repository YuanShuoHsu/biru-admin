"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type ShiftTypeForm, useShiftTypeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceShiftType } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";
import { toTimeDayjs } from "@/utils/openingHours";

interface ShiftTypeDialogProps {
  mutate: () => void;
  organizationSlug: string;
  shiftType?: AttendanceShiftType;
}

const ShiftTypeDialog = ({
  mutate,
  organizationSlug,
  shiftType,
}: ShiftTypeDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");
  const tCommon = useTranslations("common");

  const shiftTypeFormSchema = useShiftTypeFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ShiftTypeForm>({
    defaultValues: {
      endTime: shiftType?.endTime ?? "",
      name: shiftType?.name ?? "",
      startTime: shiftType?.startTime ?? "",
    },
    resolver: zodResolver(shiftTypeFormSchema),
  });

  const [endTime, startTime] = useWatch({
    control,
    name: ["endTime", "startTime"],
  });

  const onSubmitHandler = async (values: ShiftTypeForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          shiftType ? `shift-types/${shiftType.id}` : "shift-types",
        ),
        {
          method: shiftType ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );

      enqueueSnackbar(
        tAttendance(
          shiftType
            ? "shiftTypes.actions.update.success"
            : "shiftTypes.actions.create.success",
          { name: values.name },
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
    <FormBox id="attendance-shift-type-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tAttendance("name")}
        required
        {...register("name")}
      />
      <TimePicker
        ampm={false}
        format="HH:mm"
        label={tAttendance("startsAt")}
        onChange={(time) =>
          setValue("startTime", time?.isValid() ? time.format("HH:mm") : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.startTime,
            fullWidth: true,
            helperText: errors.startTime?.message,
            required: true,
          },
        }}
        value={toTimeDayjs(startTime)}
      />
      <TimePicker
        ampm={false}
        format="HH:mm"
        label={tAttendance("endsAt")}
        onChange={(time) =>
          setValue("endTime", time?.isValid() ? time.format("HH:mm") : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.endTime,
            fullWidth: true,
            helperText:
              errors.endTime?.message ??
              (endTime && endTime < startTime
                ? tCommon("location.openingHours.nextDayTime", {
                    time: endTime,
                  })
                : undefined),
            required: true,
          },
        }}
        value={toTimeDayjs(endTime)}
      />
    </FormBox>
  );
};

export default ShiftTypeDialog;
