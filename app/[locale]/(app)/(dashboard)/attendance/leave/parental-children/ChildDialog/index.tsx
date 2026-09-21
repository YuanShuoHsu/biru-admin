"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type ChildForm, useChildFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceEmployee } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface ChildDialogProps {
  employeeId?: string;
  employees: AttendanceEmployee[];
  mutate: () => void;
  organizationSlug: string;
}

const ChildDialog = ({
  employeeId: selfEmployeeId,
  employees,
  mutate,
  organizationSlug,
}: ChildDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const childFormSchema = useChildFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ChildForm>({
    defaultValues: {
      birthDate: dayjs().tz(STORE_TIMEZONE).startOf("day").toISOString(),
      employeeId: "",
      label: "",
      reference: "",
    },
    resolver: zodResolver(childFormSchema),
  });

  const [birthDate, employeeId] = useWatch({
    control,
    name: ["birthDate", "employeeId"],
  });

  const onSubmitHandler = async (values: ChildForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "children"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          birthDate: dayjs(values.birthDate)
            .tz(STORE_TIMEZONE)
            .startOf("day")
            .toISOString(),
        }),
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
    <FormBox id="attendance-child-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("parentalChildHint")}</Alert>
      <TextField
        error={!!errors.employeeId}
        fullWidth
        helperText={errors.employeeId?.message}
        label={tAttendance("employee")}
        onChange={(event) =>
          setValue("employeeId", event.target.value, {
            shouldValidate: isSubmitted,
          })
        }
        required
        select
        value={employeeId}
      >
        {employees
          .filter(({ id }) => id !== selfEmployeeId)
          .map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
      </TextField>
      <TextField
        error={!!errors.reference}
        fullWidth
        helperText={errors.reference?.message}
        label={tAttendance("childReference")}
        required
        {...register("reference")}
      />
      <TextField
        error={!!errors.label}
        fullWidth
        helperText={errors.label?.message}
        label={tAttendance("childLabel")}
        required
        {...register("label")}
      />
      <DatePicker
        label={tAttendance("childBirthDate")}
        onChange={(value) =>
          setValue(
            "birthDate",
            value?.isValid() ? value.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.birthDate,
            fullWidth: true,
            helperText: errors.birthDate?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={birthDate ? dayjs(birthDate) : null}
      />
    </FormBox>
  );
};

export default ChildDialog;
