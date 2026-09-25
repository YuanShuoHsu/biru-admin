"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import {
  type Control,
  type FieldErrors,
  type UseFormSetValue,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";

import { type EmployeeForm, useEmployeeFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Add, DeleteOutlined } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  type FormControlProps,
  FormLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceLegalStatusValues } from "@/types/api";

import type {
  AttendanceLegalStatusObligation,
  AttendanceMember,
  SaveAttendanceEmployee,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

const StyledFormControl = styled(FormControl)<FormControlProps>(
  ({ theme }) => ({
    gap: theme.spacing(2),
  }),
);

const PeriodRowStack = styled(Stack)(({ theme }) => ({
  alignItems: "flex-start",
  gap: theme.spacing(1),
}));

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

interface PeriodFieldsProps {
  control: Control<EmployeeForm>;
  errors: FieldErrors<EmployeeForm>;
  isSubmitted: boolean;
  name: "studentVacations" | "workPermits";
  setValue: UseFormSetValue<EmployeeForm>;
}

const PeriodFields = ({
  control,
  errors,
  isSubmitted,
  name,
  setValue,
}: PeriodFieldsProps) => {
  const tAttendance = useTranslations("attendance");

  const { append, fields, remove } = useFieldArray({ control, name });

  const periods = useWatch({ control, name });

  return (
    <StyledFormControl component="fieldset" variant="standard">
      <FormLabel component="legend">{tAttendance(`${name}.label`)}</FormLabel>
      {fields.map(({ id }, index) => (
        <PeriodRowStack direction="row" key={id}>
          {(["from", "to"] as const).map((bound) => (
            <DatePicker
              key={bound}
              label={tAttendance(`${name}.${bound}`)}
              onChange={(date) =>
                setValue(
                  `${name}.${index}.${bound}`,
                  date?.isValid() ? date.format("YYYY-MM-DD") : "",
                  { shouldValidate: isSubmitted },
                )
              }
              slotProps={{
                textField: {
                  error: !!errors[name]?.[index]?.[bound],
                  fullWidth: true,
                  helperText: errors[name]?.[index]?.[bound]?.message,
                },
              }}
              timezone={STORE_TIMEZONE}
              value={
                periods?.[index]?.[bound]
                  ? dayjs.tz(periods[index][bound], STORE_TIMEZONE)
                  : null
              }
            />
          ))}
          <IconButton color="error" onClick={() => remove(index)} size="small">
            <DeleteOutlined fontSize="small" />
          </IconButton>
        </PeriodRowStack>
      ))}
      <StyledButton
        onClick={() => append({ from: "", to: "" })}
        startIcon={<Add />}
        variant="outlined"
      >
        {tAttendance("add")}
      </StyledButton>
    </StyledFormControl>
  );
};

interface EmployeeDialogProps {
  legalStatusObligations: AttendanceLegalStatusObligation[];
  member: AttendanceMember;
  mutate: () => void;
  organizationSlug: string;
}

const EmployeeDialog = ({
  legalStatusObligations,
  member,
  mutate,
  organizationSlug,
}: EmployeeDialogProps) => {
  const employee = member.employee ?? undefined;

  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const employeeFormSchema = useEmployeeFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<EmployeeForm>({
    defaultValues: {
      birthDate: employee?.birthDate ?? "",
      enabled: employee?.enabled ?? true,
      hiredAt:
        employee?.hiredAt ??
        dayjs(member.joinedAt).tz(STORE_TIMEZONE).startOf("day").toISOString(),
      taiwanStaySince:
        employee?.taiwanStaySince ??
        dayjs(employee?.hiredAt ?? member.joinedAt)
          .tz(STORE_TIMEZONE)
          .format("YYYY-MM-DD"),
      legalStatus: employee?.legalStatus ?? "national",
      studentVacations: employee?.studentVacations ?? [],
      terminatedAt: employee?.terminatedAt ?? "",
      userId: member.userId,
      workPermits: employee?.workPermits ?? [],
    },
    resolver: zodResolver(employeeFormSchema),
  });

  const [
    birthDate,
    enabled,
    hiredAt,
    legalStatus,
    taiwanStaySince,
    terminatedAt,
  ] = useWatch({
    control,
    name: [
      "birthDate",
      "enabled",
      "hiredAt",
      "legalStatus",
      "taiwanStaySince",
      "terminatedAt",
    ],
  });

  const workPermitRequired = !!legalStatusObligations.find(
    (obligation) => obligation.legalStatus === legalStatus,
  )?.workPermitRequired;

  const periodFieldsProps = { control, errors, isSubmitted, setValue };

  const onSubmitHandler = async (values: EmployeeForm) => {
    try {
      setDialog({ confirmLoading: true });

      const body: SaveAttendanceEmployee = {
        birthDate: values.birthDate,
        enabled: values.enabled,
        hiredAt: values.hiredAt,
        legalStatus: values.legalStatus,
        studentVacations:
          values.legalStatus === "foreignStudent"
            ? values.studentVacations
            : [],
        userId: values.userId,
        workPermits: workPermitRequired ? values.workPermits : [],
        ...(values.legalStatus !== "national" && {
          taiwanStaySince: values.taiwanStaySince,
        }),
        ...(values.terminatedAt && { terminatedAt: values.terminatedAt }),
      };

      await fetcher(attendancePath(organizationSlug, "org", "employees"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    <FormBox id="attendance-employee-form" onSubmit={onSubmit}>
      <TextField
        fullWidth
        helperText={member.email}
        label={tAttendance("employee")}
        slotProps={{ input: { readOnly: true } }}
        value={member.name}
      />
      <TextField
        fullWidth
        label={tAttendance("legalStatus.label")}
        onChange={(event) =>
          setValue(
            "legalStatus",
            event.target.value as EmployeeForm["legalStatus"],
          )
        }
        required
        select
        value={legalStatus}
      >
        {attendanceLegalStatusValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`legalStatus.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <DatePicker
        label={tAttendance("birthDate")}
        disableFuture
        onChange={(date) =>
          setValue(
            "birthDate",
            date?.isValid() ? date.format("YYYY-MM-DD") : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.birthDate,
            fullWidth: true,
            helperText: errors.birthDate?.message,
            required: true,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={birthDate ? dayjs.tz(birthDate, STORE_TIMEZONE) : null}
      />
      {legalStatus !== "national" && (
        <DatePicker
          label={tAttendance("taiwanStaySince")}
          onChange={(date) =>
            setValue(
              "taiwanStaySince",
              date?.isValid() ? date.format("YYYY-MM-DD") : "",
              { shouldValidate: isSubmitted },
            )
          }
          slotProps={{
            textField: {
              error: !!errors.taiwanStaySince,
              fullWidth: true,
              helperText: errors.taiwanStaySince?.message,
              required: true,
            },
          }}
          timezone={STORE_TIMEZONE}
          value={
            taiwanStaySince ? dayjs.tz(taiwanStaySince, STORE_TIMEZONE) : null
          }
        />
      )}
      {workPermitRequired && (
        <PeriodFields name="workPermits" {...periodFieldsProps} />
      )}
      {legalStatus === "foreignStudent" && (
        <PeriodFields name="studentVacations" {...periodFieldsProps} />
      )}
      <DatePicker
        label={tAttendance("hiredAt")}
        maxDate={
          terminatedAt ? dayjs(terminatedAt).subtract(1, "day") : undefined
        }
        onChange={(date) =>
          setValue(
            "hiredAt",
            date?.isValid() ? date.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.hiredAt,
            fullWidth: true,
            helperText: errors.hiredAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={hiredAt ? dayjs(hiredAt) : null}
      />
      <DatePicker
        label={tAttendance("terminatedAt")}
        minDate={hiredAt ? dayjs(hiredAt).add(1, "day") : undefined}
        onChange={(date) =>
          setValue(
            "terminatedAt",
            date?.isValid() ? date.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          field: { clearable: true },
          textField: {
            error: !!errors.terminatedAt,
            fullWidth: true,
            helperText: errors.terminatedAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={terminatedAt ? dayjs(terminatedAt) : null}
      />
      <StyledFormControlLabel
        control={
          <Checkbox
            checked={enabled}
            onChange={(_, checked) => setValue("enabled", checked)}
          />
        }
        label={tAttendance("enabled")}
      />
    </FormBox>
  );
};

export default EmployeeDialog;
