"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  AMOUNT_FIELDS,
  AUTO_INSURANCE_AMOUNT_FIELDS,
  DECLARED_INSURANCE_FIELDS,
  PENSION_PERCENT_FIELDS,
  type TermsForm,
  useTermsFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useMonthFormat } from "@/hooks/useMonthFormat";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  Checkbox,
  FormControl,
  FormControlLabel,
  type FormControlProps,
  FormLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  payrollEmploymentInsuranceExemptionValues,
  payrollHealthInsuranceExemptionValues,
  payrollLaborInsuranceExemptionValues,
  payrollMonthlyProrationValues,
  payrollSalaryTypeValues,
  payrollTaxMethodValues,
} from "@/types/api";
import type { AttendanceEmployee, PayrollTerms } from "@/types/attendance";

import {
  attendanceErrorKey,
  fromCents,
  payrollPath,
  toCents,
} from "@/utils/attendance";
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

interface ExemptionSelectProps {
  label: string;
  none: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value?: string | null;
}

const ExemptionSelect = ({
  label,
  none,
  onChange,
  options,
  value,
}: ExemptionSelectProps) => (
  <TextField
    fullWidth
    label={label}
    onChange={(event) => onChange(event.target.value)}
    select
    value={value ?? ""}
  >
    <MenuItem value="">{none}</MenuItem>
    {options.map((option) => (
      <MenuItem key={option.value} value={option.value}>
        {option.label}
      </MenuItem>
    ))}
  </TextField>
);

interface TermsDialogProps {
  currency: string;
  employees: AttendanceEmployee[];
  mutate: () => void;
  organizationSlug: string;
  terms: PayrollTerms[];
}

const TermsDialog = ({
  currency,
  employees,
  mutate,
  organizationSlug,
  terms,
}: TermsDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const monthFormat = useMonthFormat();

  const termsFormSchema = useTermsFormSchema();

  const employeeValues = (
    employeeId: string,
  ): Omit<TermsForm, "effectiveFrom" | "employeeId" | "sourceNote"> => {
    const current = terms.find((item) => item.employeeId === employeeId)?.terms;

    return {
      autoInsurance: current?.insurance
        ? !current.insurance.manualPremiums
        : !current,
      allowanceHours: current?.allowanceHours ?? null,
      employerPercent: current?.insurance?.employerPercent || 6,
      healthDependents: current?.insurance?.healthDependents ?? 0,
      healthInsuranceExemption:
        current?.insurance?.healthInsuranceExemption ?? null,
      healthInsured: current?.insurance
        ? current.insurance.healthBasis > 0
        : true,
      employmentInsuranceExemption:
        current?.insurance?.employmentInsuranceExemption ?? null,
      laborInsuranceExemption:
        current?.insurance?.laborInsuranceExemption ?? null,
      monthlyProration: current?.monthlyProration ?? "thirtyDays",
      salaryType: current?.salaryType ?? "monthly",
      taxMethod: current?.insurance?.taxMethod ?? "verified",
      voluntaryLaborInsurance:
        current?.insurance?.laborCoverage === "both" ||
        current?.insurance?.laborCoverage === "labor",
      voluntaryPercent: current?.insurance?.voluntaryPercent ?? 0,
      ...(Object.fromEntries(
        AMOUNT_FIELDS.map((name) => [
          name,
          current ? fromCents(current[`${name}Cents`]) : 0,
        ]),
      ) as Record<(typeof AMOUNT_FIELDS)[number], number>),
    };
  };

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<TermsForm>({
    defaultValues: {
      effectiveFrom: dayjs().tz(STORE_TIMEZONE).startOf("month").toISOString(),
      employeeId: "",
      sourceNote: "",
      ...employeeValues(""),
    },
    resolver: zodResolver(termsFormSchema),
  });

  const values = useWatch({ control });

  const employee = employees.find(({ id }) => id === values.employeeId);
  const employmentInsuranceEligible =
    employee?.employmentInsuranceEligible ?? true;
  const pensionApplicable = employee?.pensionApplicable ?? true;
  const declared = terms.find((item) => item.employeeId === values.employeeId)
    ?.terms.insurance;

  const onSubmitHandler = async (form: TermsForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(payrollPath(organizationSlug, "org", "terms"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          effectiveFrom: dayjs(form.effectiveFrom)
            .tz(STORE_TIMEZONE)
            .format("YYYY-MM-DD"),
          employeeId: form.employeeId,
          monthlyProration: form.monthlyProration,
          salaryType: form.salaryType,
          ...(form.sourceNote && { sourceNote: form.sourceNote }),
          ...(form.allowanceHours
            ? { allowanceHours: form.allowanceHours }
            : {}),
          ...Object.fromEntries(
            AMOUNT_FIELDS.map((name) => [
              `${name}Cents`,
              form.autoInsurance &&
              AUTO_INSURANCE_AMOUNT_FIELDS.some((field) => field === name)
                ? "0"
                : toCents(form[name]),
            ]),
          ),
          insurance: {
            employerPercent: form.employerPercent,
            ...(employmentInsuranceEligible &&
              form.employmentInsuranceExemption && {
                employmentInsuranceExemption: form.employmentInsuranceExemption,
              }),
            healthDependents: form.healthDependents,
            ...(!form.healthInsured &&
              form.healthInsuranceExemption && {
                healthInsuranceExemption: form.healthInsuranceExemption,
              }),
            healthInsured: form.healthInsured,
            ...(form.laborInsuranceExemption && {
              laborInsuranceExemption: form.laborInsuranceExemption,
            }),
            manualPremiums: !form.autoInsurance,
            taxMethod: form.taxMethod,
            voluntaryLaborInsurance: form.voluntaryLaborInsurance,
            voluntaryPercent: form.voluntaryPercent,
          },
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
    <FormBox id="payroll-terms-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("payrollHint")}</Alert>
      <TextField
        error={!!errors.employeeId}
        fullWidth
        helperText={errors.employeeId?.message}
        label={tAttendance("employee")}
        onChange={(event) =>
          reset({
            effectiveFrom: values.effectiveFrom,
            employeeId: event.target.value,
            sourceNote: "",
            ...employeeValues(event.target.value),
          })
        }
        required
        select
        value={values.employeeId ?? ""}
      >
        {employees.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      <DatePicker
        format={monthFormat}
        label={tAttendance("effectiveFrom")}
        onChange={(value) =>
          setValue(
            "effectiveFrom",
            value?.isValid() ? value.startOf("month").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.effectiveFrom,
            fullWidth: true,
            helperText: errors.effectiveFrom?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={values.effectiveFrom ? dayjs(values.effectiveFrom) : null}
        views={["year", "month"]}
      />
      <TextField
        error={!!errors.salaryType}
        fullWidth
        helperText={errors.salaryType?.message}
        label={tAttendance("salaryType.label")}
        required
        select
        value={values.salaryType ?? ""}
        {...register("salaryType")}
      >
        {payrollSalaryTypeValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`salaryType.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.monthlyProration}
        fullWidth
        helperText={errors.monthlyProration?.message}
        label={tAttendance("monthlyProration.label")}
        required
        select
        value={values.monthlyProration ?? ""}
        {...register("monthlyProration")}
      >
        {payrollMonthlyProrationValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`monthlyProration.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <NumberSpinner
        clearable
        error={!!errors.allowanceHours}
        fullWidth
        helperText={errors.allowanceHours?.message}
        label={tAttendance("allowanceHours")}
        max={744}
        min={1}
        onValueChange={(value) =>
          setValue("allowanceHours", value, { shouldValidate: isSubmitted })
        }
        value={values.allowanceHours ?? null}
      />
      <StyledFormControlLabel
        control={
          <Checkbox
            checked={!!values.autoInsurance}
            onChange={(_, checked) => setValue("autoInsurance", checked)}
          />
        }
        label={tAttendance("autoInsurance")}
      />
      {AMOUNT_FIELDS.filter(
        (name) =>
          !values.autoInsurance ||
          !AUTO_INSURANCE_AMOUNT_FIELDS.some((field) => field === name),
      ).map((name) => (
        <NumberSpinner
          error={!!errors[name]}
          fullWidth
          helperText={errors[name]?.message}
          key={name}
          label={tAttendance(name, { currency })}
          min={0}
          onValueChange={(value) =>
            setValue(name, value ?? 0, { shouldValidate: isSubmitted })
          }
          step={0.01}
          value={values[name] ?? 0}
        />
      ))}
      {declared && (
        <StyledFormControl component="fieldset" variant="standard">
          <FormLabel component="legend">
            {tAttendance("declaredInsurance")}
          </FormLabel>
          {DECLARED_INSURANCE_FIELDS.map((name) => (
            <TextField
              fullWidth
              key={name}
              label={tAttendance(name, { currency })}
              slotProps={{ input: { readOnly: true } }}
              value={format.number(declared[name])}
            />
          ))}
        </StyledFormControl>
      )}
      <StyledFormControlLabel
        control={
          <Checkbox
            checked={!!values.voluntaryLaborInsurance}
            onChange={(_, checked) =>
              setValue("voluntaryLaborInsurance", checked)
            }
          />
        }
        label={tAttendance("voluntaryLaborInsurance")}
      />
      <ExemptionSelect
        label={tAttendance("laborInsuranceExemption.label")}
        none={tAttendance("laborInsuranceExemption.none")}
        onChange={(value) =>
          setValue(
            "laborInsuranceExemption",
            payrollLaborInsuranceExemptionValues.find(
              (option) => option === value,
            ) ?? null,
          )
        }
        options={payrollLaborInsuranceExemptionValues.map((option) => ({
          label: tAttendance(`laborInsuranceExemption.options.${option}`),
          value: option,
        }))}
        value={values.laborInsuranceExemption}
      />
      {employmentInsuranceEligible && (
        <ExemptionSelect
          label={tAttendance("employmentInsuranceExemption.label")}
          none={tAttendance("employmentInsuranceExemption.none")}
          onChange={(value) =>
            setValue(
              "employmentInsuranceExemption",
              payrollEmploymentInsuranceExemptionValues.find(
                (option) => option === value,
              ) ?? null,
            )
          }
          options={payrollEmploymentInsuranceExemptionValues.map((option) => ({
            label: tAttendance(
              `employmentInsuranceExemption.options.${option}`,
            ),
            value: option,
          }))}
          value={values.employmentInsuranceExemption}
        />
      )}
      <StyledFormControlLabel
        control={
          <Checkbox
            checked={!!values.healthInsured}
            onChange={(_, checked) => setValue("healthInsured", checked)}
          />
        }
        label={tAttendance("healthInsured")}
      />
      {values.healthInsured ? (
        <NumberSpinner
          error={!!errors.healthDependents}
          fullWidth
          helperText={errors.healthDependents?.message}
          label={tAttendance("healthDependents")}
          max={20}
          min={0}
          onValueChange={(value) =>
            setValue("healthDependents", value ?? 0, {
              shouldValidate: isSubmitted,
            })
          }
          value={values.healthDependents ?? 0}
        />
      ) : (
        <ExemptionSelect
          label={tAttendance("healthInsuranceExemption.label")}
          none={tAttendance("healthInsuranceExemption.none")}
          onChange={(value) =>
            setValue(
              "healthInsuranceExemption",
              payrollHealthInsuranceExemptionValues.find(
                (option) => option === value,
              ) ?? null,
            )
          }
          options={payrollHealthInsuranceExemptionValues.map((option) => ({
            label: tAttendance(`healthInsuranceExemption.options.${option}`),
            value: option,
          }))}
          value={values.healthInsuranceExemption}
        />
      )}
      {pensionApplicable &&
        PENSION_PERCENT_FIELDS.map(({ max, min, name }) => (
          <NumberSpinner
            error={!!errors[name]}
            fullWidth
            helperText={errors[name]?.message}
            key={name}
            label={tAttendance(name)}
            max={max}
            min={min}
            onValueChange={(value) =>
              setValue(name, value ?? min, { shouldValidate: isSubmitted })
            }
            value={values[name] ?? min}
          />
        ))}
      <TextField
        error={!!errors.taxMethod}
        fullWidth
        helperText={errors.taxMethod?.message}
        label={tAttendance("taxMethod.label")}
        required
        select
        value={values.taxMethod ?? ""}
        {...register("taxMethod")}
      >
        {payrollTaxMethodValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`taxMethod.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.sourceNote}
        fullWidth
        helperText={errors.sourceNote?.message}
        label={tAttendance("sourceNote")}
        minRows={3}
        multiline
        {...register("sourceNote")}
      />
    </FormBox>
  );
};

export default TermsDialog;
