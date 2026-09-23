"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import {
  AMOUNT_FIELDS,
  AUTO_INSURANCE_AMOUNT_FIELDS,
  INSURANCE_NUMBER_FIELDS,
  PENSION_BASIS_RANGE,
  type TermsForm,
  useTermsFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  payrollMonthlyProrationValues,
  payrollSalaryTypeValues,
  payrollLaborCoverageValues,
  payrollLaborLadderValues,
  payrollTaxMethodValues,
} from "@/types/api";
import type {
  AttendanceEmployee,
  PayrollInsuranceGrades,
  PayrollTerms,
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

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

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
  const tValidation = useTranslations("validation");

  const termsFormSchema = useTermsFormSchema();

  const employeeValues = (
    employeeId: string,
  ): Omit<TermsForm, "effectiveFrom" | "employeeId" | "sourceNote"> => {
    const current = terms.find((item) => item.employeeId === employeeId)?.terms;

    return {
      autoInsurance: !!current?.insurance,
      allowanceHours: current?.allowanceHours ?? null,
      employerPercent: current?.insurance?.employerPercent ?? 6,
      healthBasis: current?.insurance?.healthBasis ?? null,
      healthDependents: current?.insurance?.healthDependents ?? 0,
      laborBasis: current?.insurance?.laborBasis ?? null,
      laborCoverage: current?.insurance?.laborCoverage ?? "both",
      laborLadder: current?.insurance?.laborLadder ?? "general",
      monthlyProration: current?.monthlyProration ?? "thirtyDays",
      pensionBasis: current?.insurance?.pensionBasis ?? null,
      salaryType: current?.salaryType ?? "monthly",
      taxMethod: current?.insurance?.taxMethod ?? "verified",
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
    setError,
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

  const month = values.effectiveFrom
    ? dayjs(values.effectiveFrom).tz(STORE_TIMEZONE).format("YYYY-MM")
    : "";

  const { data: grades, error: gradesError } = useSWR<PayrollInsuranceGrades>(
    values.autoInsurance && month
      ? `${payrollPath(organizationSlug, "org", "insurance-grades")}?month=${month}`
      : null,
    fetcher,
  );

  const laborGrades =
    values.laborLadder === "partTime"
      ? grades?.partTimeLaborGrades
      : grades?.laborGrades;

  const gradeFields = [
    ...(values.laborCoverage === "none"
      ? []
      : [{ name: "laborBasis" as const, options: laborGrades }]),
    {
      name: "healthBasis" as const,
      options: grades && [0, ...grades.healthGrades],
    },
  ];

  const isOutdatedGrade = (
    value: number | null | undefined,
    options?: number[],
  ) => value != null && !!options && !options.includes(value);

  const onSubmitHandler = async (form: TermsForm) => {
    if (form.autoInsurance) {
      const outdated = gradeFields.filter(
        ({ name, options }) => !options?.includes(form[name] ?? 0),
      );

      for (const { name } of outdated)
        setError(name, { message: tValidation(`${name}.notSelected`) });

      if (outdated.length) return;
    }

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
          sourceNote: form.sourceNote,
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
          ...(form.autoInsurance
            ? {
                insurance: {
                  employerPercent: form.employerPercent,
                  healthBasis: form.healthBasis,
                  healthDependents: form.healthDependents,
                  laborBasis:
                    form.laborCoverage === "none" ? 0 : form.laborBasis,
                  laborCoverage: form.laborCoverage,
                  laborLadder: form.laborLadder,
                  pensionBasis: form.pensionBasis,
                  taxMethod: form.taxMethod,
                  voluntaryPercent: form.voluntaryPercent,
                },
              }
            : {}),
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
      {values.autoInsurance && (
        <>
          {gradesError && (
            <Alert severity="error">
              {tAttendance(attendanceErrorKey(gradesError))}
            </Alert>
          )}
          <TextField
            error={!!errors.laborCoverage}
            fullWidth
            helperText={errors.laborCoverage?.message}
            label={tAttendance("laborCoverage.label")}
            required
            select
            value={values.laborCoverage ?? ""}
            {...register("laborCoverage")}
          >
            {payrollLaborCoverageValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tAttendance(`laborCoverage.options.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          {values.laborCoverage !== "none" && (
            <TextField
              error={!!errors.laborLadder}
              fullWidth
              helperText={errors.laborLadder?.message}
              label={tAttendance("laborLadder.label")}
              required
              select
              value={values.laborLadder ?? ""}
              {...register("laborLadder")}
            >
              {payrollLaborLadderValues.map((value) => (
                <MenuItem key={value} value={value}>
                  {tAttendance(`laborLadder.options.${value}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {gradeFields.map(({ name, options }) => {
            const value = values[name];
            const outdated = isOutdatedGrade(value, options);

            return (
              <TextField
                disabled={!options}
                error={!!errors[name] || outdated}
                fullWidth
                helperText={
                  errors[name]?.message ??
                  (outdated
                    ? tAttendance("errors.insuranceBasisOutdated")
                    : undefined)
                }
                key={name}
                label={tAttendance(name, { currency })}
                onChange={(event) =>
                  setValue(name, Number(event.target.value), {
                    shouldValidate: isSubmitted,
                  })
                }
                required
                select
                value={value != null && !outdated && options ? value : ""}
              >
                {(options ?? []).map((grade) => (
                  <MenuItem key={grade} value={grade}>
                    {format.number(grade)}
                  </MenuItem>
                ))}
              </TextField>
            );
          })}
          <NumberSpinner
            clearable
            error={!!errors.pensionBasis}
            fullWidth
            helperText={errors.pensionBasis?.message}
            label={tAttendance("pensionBasis", { currency })}
            max={PENSION_BASIS_RANGE.max}
            min={PENSION_BASIS_RANGE.min}
            onValueChange={(value) =>
              setValue("pensionBasis", value, { shouldValidate: isSubmitted })
            }
            required
            value={values.pensionBasis ?? null}
          />
          {INSURANCE_NUMBER_FIELDS.map(({ max, min, name }) => (
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
        </>
      )}
      <TextField
        error={!!errors.sourceNote}
        fullWidth
        helperText={errors.sourceNote?.message}
        label={tAttendance("sourceNote")}
        minRows={3}
        multiline
        required
        {...register("sourceNote")}
      />
    </FormBox>
  );
};

export default TermsDialog;
