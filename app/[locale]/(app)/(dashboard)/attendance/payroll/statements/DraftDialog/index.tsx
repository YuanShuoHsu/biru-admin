"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import BatchSkippedList from "../../../BatchSkippedList";
import { type DraftForm, useDraftFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useMonthFormat } from "@/hooks/useMonthFormat";

import { zodResolver } from "@hookform/resolvers/zod";

import { Add, DeleteOutlined } from "@mui/icons-material";
import {
  Button,
  FormControl,
  type FormControlProps,
  FormLabel,
  IconButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceBatchResult,
  AttendanceEmployee,
  PayrollEarningInput,
  PayrollEarningType,
  PayrollStatement,
} from "@/types/attendance";

import {
  attendanceErrorKey,
  fromCents,
  payrollPath,
  toCents,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledFormControl = styled(FormControl)<FormControlProps>(
  ({ theme }) => ({
    gap: theme.spacing(2),
  }),
);

const EarningRowStack = styled(Stack)(({ theme }) => ({
  alignItems: "flex-start",
  gap: theme.spacing(1),
}));

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

interface DraftDialogProps {
  currency: string;
  earningTypes: PayrollEarningType[];
  employees: AttendanceEmployee[];
  mutate: () => void;
  organizationSlug: string;
}

const DraftDialog = ({
  currency,
  earningTypes,
  employees,
  mutate,
  organizationSlug,
}: DraftDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const monthFormat = useMonthFormat();

  const draftFormSchema = useDraftFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<DraftForm>({
    defaultValues: {
      earnings: [],
      employeeId: "",
      month: dayjs().tz(STORE_TIMEZONE).subtract(1, "month").format("YYYY-MM"),
      reason: "",
    },
    resolver: zodResolver(draftFormSchema),
  });

  const [earnings, employeeId, month] = useWatch({
    control,
    name: ["earnings", "employeeId", "month"],
  });

  const { append, fields, remove, replace } = useFieldArray({
    control,
    name: "earnings",
  });

  useSWR(
    earningTypes.length && employeeId && month
      ? `${payrollPath(organizationSlug, "org", "earnings")}?${new URLSearchParams({ employeeId, month })}`
      : null,
    (key: string) => fetcher<PayrollEarningInput[]>(key),
    {
      onSuccess: (entered) =>
        replace(
          entered.map(({ amountCents, earningTypeId }) => ({
            amount: fromCents(amountCents),
            earningTypeId,
          })),
        ),
      revalidateOnFocus: false,
    },
  );

  const onSubmitHandler = async (values: DraftForm) => {
    try {
      setDialog({ confirmLoading: true });

      if (!values.employeeId) {
        const { skipped, succeeded } = await fetcher<AttendanceBatchResult>(
          payrollPath(organizationSlug, "org", "statements/batch"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              month: values.month,
              reason: values.reason,
            }),
          },
        );

        if (succeeded.length)
          enqueueSnackbar(
            tAttendance("payroll.draftedAll", {
              count: succeeded.length,
              month: dayjs(values.month).format(monthFormat),
            }),
            { variant: "success" },
          );

        mutate();

        if (skipped.length)
          setDialog({
            confirmLoading: false,
            content: (
              <BatchSkippedList
                labels={Object.fromEntries(
                  employees.map(({ id, name }) => [id, name]),
                )}
                skipped={skipped}
              />
            ),
            formId: undefined,
            showConfirm: false,
            title: tAttendance("batch.skipped", { count: skipped.length }),
          });
        else closeDialog();

        return;
      }

      const statement = await fetcher<PayrollStatement>(
        payrollPath(organizationSlug, "org", "statements"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            earnings: values.earnings.map(({ amount, earningTypeId }) => ({
              amountCents: toCents(amount),
              earningTypeId,
            })),
            idempotencyKey: crypto.randomUUID(),
          }),
        },
      );

      enqueueSnackbar(
        tAttendance("payroll.drafted", {
          month: dayjs(statement.month).format(monthFormat),
          name: statement.employeeName,
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
    <FormBox id="payroll-draft-form" onSubmit={onSubmit}>
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
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: { displayEmpty: true },
        }}
        value={employeeId}
      >
        <MenuItem value="">{tAttendance("allEmployees")}</MenuItem>
        {employees.map(({ email, id, name }) => (
          <MenuItem key={id} value={id}>
            <ListItemText
              primary={name}
              secondary={email}
              slotProps={{ secondary: { variant: "caption" } }}
            />
          </MenuItem>
        ))}
      </TextField>
      <DatePicker
        format={monthFormat}
        label={tAttendance("month")}
        onChange={(value) =>
          setValue("month", value?.isValid() ? value.format("YYYY-MM") : "", {
            shouldValidate: isSubmitted,
          })
        }
        slotProps={{
          textField: {
            error: !!errors.month,
            fullWidth: true,
            helperText: errors.month?.message,
            required: true,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={month ? dayjs(month, "YYYY-MM") : null}
        views={["year", "month"]}
      />
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("payroll.draftReason")}
        minRows={3}
        multiline
        {...register("reason")}
      />
      {earningTypes.length > 0 && !!employeeId && (
        <StyledFormControl component="fieldset" variant="standard">
          <FormLabel component="legend">
            {tAttendance("earnings.label")}
          </FormLabel>
          {fields.map(({ id }, index) => (
            <EarningRowStack direction="row" key={id}>
              <TextField
                error={!!errors.earnings?.[index]?.earningTypeId}
                fullWidth
                helperText={errors.earnings?.[index]?.earningTypeId?.message}
                label={tAttendance("earningTypes.item")}
                onChange={(event) =>
                  setValue(
                    `earnings.${index}.earningTypeId`,
                    event.target.value,
                    { shouldValidate: isSubmitted },
                  )
                }
                required
                select
                value={earnings?.[index]?.earningTypeId ?? ""}
              >
                {earningTypes.map(({ category, id: typeId, name }) => (
                  <MenuItem key={typeId} value={typeId}>
                    {`${name}（${tAttendance(`earningCategory.options.${category}`)}）`}
                  </MenuItem>
                ))}
              </TextField>
              <NumberSpinner
                error={!!errors.earnings?.[index]?.amount}
                fullWidth
                helperText={errors.earnings?.[index]?.amount?.message}
                label={tAttendance("amount", { currency })}
                min={0}
                onValueChange={(value) =>
                  setValue(`earnings.${index}.amount`, value ?? 0, {
                    shouldValidate: isSubmitted,
                  })
                }
                required
                step={0.01}
                value={earnings?.[index]?.amount ?? 0}
              />
              <IconButton
                color="error"
                onClick={() => remove(index)}
                size="small"
              >
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </EarningRowStack>
          ))}
          <StyledButton
            onClick={() => append({ amount: 0, earningTypeId: "" })}
            startIcon={<Add />}
            variant="outlined"
          >
            {tAttendance("add")}
          </StyledButton>
        </StyledFormControl>
      )}
    </FormBox>
  );
};

export default DraftDialog;
