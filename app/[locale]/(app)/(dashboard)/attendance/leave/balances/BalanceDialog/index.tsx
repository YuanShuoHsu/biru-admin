"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type BalanceForm, useBalanceFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  AttendanceLeaveType,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface BalanceDialogProps {
  employees: AttendanceEmployee[];
  leaveTypes: AttendanceLeaveType[];
  mutate: () => void;
  organizationSlug: string;
}

const BalanceDialog = ({
  employees,
  leaveTypes,
  mutate,
  organizationSlug,
}: BalanceDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const balanceFormSchema = useBalanceFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<BalanceForm>({
    defaultValues: {
      employeeId: "",
      grantedMinutes: 0,
      leaveTypeId: "",
      year: dayjs().tz(STORE_TIMEZONE).year(),
    },
    resolver: zodResolver(balanceFormSchema),
  });

  const [employeeId, grantedMinutes, leaveTypeId, year] = useWatch({
    control,
    name: ["employeeId", "grantedMinutes", "leaveTypeId", "year"],
  });

  const onSubmitHandler = async (values: BalanceForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "all", "leave-balances"), {
        method: "PUT",
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
    <FormBox id="attendance-balance-form" onSubmit={onSubmit}>
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
        {employees.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.leaveTypeId}
        fullWidth
        helperText={errors.leaveTypeId?.message}
        label={tAttendance("leaveType")}
        onChange={(event) =>
          setValue("leaveTypeId", event.target.value, {
            shouldValidate: isSubmitted,
          })
        }
        required
        select
        value={leaveTypeId}
      >
        {leaveTypes.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      <NumberSpinner
        error={!!errors.year}
        fullWidth
        helperText={errors.year?.message}
        label={tAttendance("year")}
        max={2100}
        min={2026}
        onValueChange={(value) =>
          setValue("year", value ?? 2026, { shouldValidate: isSubmitted })
        }
        value={year}
      />
      <NumberSpinner
        error={!!errors.grantedMinutes}
        fullWidth
        helperText={errors.grantedMinutes?.message}
        label={tAttendance("grantedMinutes")}
        max={525600}
        min={0}
        onValueChange={(value) =>
          setValue("grantedMinutes", value ?? 0, {
            shouldValidate: isSubmitted,
          })
        }
        value={grantedMinutes}
      />
    </FormBox>
  );
};

export default BalanceDialog;
