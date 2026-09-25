"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { type SettingsForm, useSettingsFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { ALLOWED_IPS_MAX } from "@/constants/attendance";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useMonthFormat } from "@/hooks/useMonthFormat";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";

import { Add, DeleteOutlined, MyLocation } from "@mui/icons-material";
import {
  Button,
  FormControl,
  type FormControlProps,
  FormHelperText,
  FormLabel,
  IconButton,
  ListSubheader,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceSettings,
  OccupationalIndustryRate,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const StyledFormControl = styled(FormControl)<FormControlProps>(
  ({ theme }) => ({
    gap: theme.spacing(2),
  }),
);

const IpFieldStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(0.5),
}));

const IpRowStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  gap: theme.spacing(1),
}));

interface SettingsDialogProps {
  occupationalIndustryRates: OccupationalIndustryRate[];
  organizationSlug: string;
  settings: AttendanceSettings | null;
}

const SettingsDialog = ({
  occupationalIndustryRates,
  organizationSlug,
  settings,
}: SettingsDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [locating, setLocating] = useState(false);

  const router = useRouter();

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const monthFormat = useMonthFormat();

  const settingsFormSchema = useSettingsFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<SettingsForm>({
    defaultValues: {
      allowedIps: settings?.allowedIps.length
        ? settings.allowedIps.map((value) => ({ value }))
        : [{ value: "" }],
      graceMinutes: settings?.graceMinutes ?? 0,
      laborInsuranceUnitCode: settings?.laborInsuranceUnitCode ?? "",
      occupationalExperienceRate:
        settings?.occupationalExperienceRateMicros == null
          ? null
          : settings.occupationalExperienceRateMicros / 10000,
      occupationalIndustryCode: settings?.occupationalIndustryCode ?? "",
      latitude: settings?.latitude ?? null,
      longitude: settings?.longitude ?? null,
      overtimeExtensionPeriods:
        settings?.overtimeExtensionPeriods.map((value) => ({ value })) ?? [],
      radiusMeters: settings?.radiusMeters ?? 100,
      voluntaryLaborInsuranceFrom: settings?.voluntaryLaborInsuranceFrom ?? "",
    },
    resolver: zodResolver(settingsFormSchema),
  });

  const [
    graceMinutes,
    latitude,
    longitude,
    occupationalExperienceRate,
    occupationalIndustryCode,
    radiusMeters,
    voluntaryLaborInsuranceFrom,
  ] = useWatch({
    control,
    name: [
      "graceMinutes",
      "latitude",
      "longitude",
      "occupationalExperienceRate",
      "occupationalIndustryCode",
      "radiusMeters",
      "voluntaryLaborInsuranceFrom",
    ],
  });

  const industryCategories = [
    ...new Set(occupationalIndustryRates.map(({ category }) => category)),
  ];

  const industryLabel = ({ industry, rateMicros }: OccupationalIndustryRate) =>
    `${industry} · ${format.number(rateMicros / 1000000, {
      maximumFractionDigits: 6,
      style: "percent",
    })}`;

  const { append, fields, remove } = useFieldArray({
    control,
    name: "allowedIps",
  });

  const {
    append: appendPeriod,
    fields: periodFields,
    remove: removePeriod,
  } = useFieldArray({ control, name: "overtimeExtensionPeriods" });

  const periods = useWatch({ control, name: "overtimeExtensionPeriods" });

  const firstAllowedIp = useWatch({ control, name: "allowedIps.0.value" });

  const handleAllowedIpRemove = (index: number) =>
    fields.length > 1
      ? remove(index)
      : setValue("allowedIps.0.value", "", { shouldValidate: isSubmitted });

  const onSubmitHandler = async (values: SettingsForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedIps: values.allowedIps.map(({ value }) => value.trim()),
          graceMinutes: values.graceMinutes,
          laborInsuranceUnitCode: values.laborInsuranceUnitCode || null,
          latitude: values.latitude,
          longitude: values.longitude,
          occupationalExperienceRateMicros:
            values.occupationalExperienceRate === null
              ? null
              : Math.round(values.occupationalExperienceRate * 10000),
          occupationalIndustryCode: values.occupationalIndustryCode || null,
          radiusMeters: values.radiusMeters,
          overtimeExtensionPeriods: values.overtimeExtensionPeriods.map(
            ({ value }) => value,
          ),
          voluntaryLaborInsuranceFrom:
            values.voluntaryLaborInsuranceFrom || null,
        }),
      });

      enqueueSnackbar(tAttendance("success"), { variant: "success" });

      closeDialog();

      router.refresh();
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      enqueueSnackbar(tAttendance("locationError"), { variant: "error" });

      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setValue("latitude", Number(coords.latitude.toFixed(6)), {
          shouldValidate: isSubmitted,
        });
        setValue("longitude", Number(coords.longitude.toFixed(6)), {
          shouldValidate: isSubmitted,
        });
        setLocating(false);
      },
      () => {
        enqueueSnackbar(tAttendance("locationError"), { variant: "error" });
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-settings-form" onSubmit={onSubmit}>
      <StyledButton
        loading={locating}
        onClick={handleUseCurrentLocation}
        startIcon={<MyLocation />}
        variant="outlined"
      >
        {tAttendance("useCurrentLocation")}
      </StyledButton>
      <NumberSpinner
        error={!!errors.latitude}
        fullWidth
        helperText={errors.latitude?.message}
        label={tAttendance("latitude.label")}
        max={90}
        min={-90}
        onValueChange={(value) =>
          setValue("latitude", value, { shouldValidate: isSubmitted })
        }
        step={0.0001}
        required
        value={latitude}
      />
      <NumberSpinner
        error={!!errors.longitude}
        fullWidth
        helperText={errors.longitude?.message}
        label={tAttendance("longitude.label")}
        max={180}
        min={-180}
        onValueChange={(value) =>
          setValue("longitude", value, { shouldValidate: isSubmitted })
        }
        step={0.0001}
        required
        value={longitude}
      />
      <NumberSpinner
        error={!!errors.radiusMeters}
        fullWidth
        helperText={errors.radiusMeters?.message}
        label={tAttendance("radiusMeters.label")}
        max={10000}
        min={10}
        onValueChange={(value) =>
          setValue("radiusMeters", value ?? 10, { shouldValidate: isSubmitted })
        }
        value={radiusMeters}
      />
      <StyledFormControl
        component="fieldset"
        error={!!errors.allowedIps}
        variant="standard"
      >
        <FormLabel component="legend">
          {tAttendance("allowedIps.label")}
        </FormLabel>
        {fields.map(({ id }, index) => (
          <IpFieldStack key={id}>
            <IpRowStack direction="row">
              <TextField
                error={!!errors.allowedIps?.[index]?.value}
                fullWidth
                placeholder={tAttendance("allowedIps.placeholder")}
                required
                {...register(`allowedIps.${index}.value`)}
              />
              <IconButton
                color="error"
                disabled={fields.length === 1 && !firstAllowedIp}
                onClick={() => handleAllowedIpRemove(index)}
                size="small"
              >
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </IpRowStack>
            {errors.allowedIps?.[index]?.value && (
              <FormHelperText error>
                {errors.allowedIps[index].value.message}
              </FormHelperText>
            )}
          </IpFieldStack>
        ))}
        {errors.allowedIps?.message && (
          <FormHelperText error>{errors.allowedIps.message}</FormHelperText>
        )}
        <Button
          disabled={fields.length >= ALLOWED_IPS_MAX}
          onClick={() => append({ value: "" })}
          startIcon={<Add />}
          variant="outlined"
        >
          {tAttendance("add")}
        </Button>
      </StyledFormControl>
      <NumberSpinner
        error={!!errors.graceMinutes}
        fullWidth
        helperText={errors.graceMinutes?.message}
        label={tAttendance("graceMinutes.label")}
        max={60}
        min={0}
        onValueChange={(value) =>
          setValue("graceMinutes", value ?? 0, { shouldValidate: isSubmitted })
        }
        value={graceMinutes}
      />
      <TextField
        error={!!errors.laborInsuranceUnitCode}
        fullWidth
        helperText={errors.laborInsuranceUnitCode?.message}
        label={tAttendance("laborInsuranceUnitCode.label")}
        slotProps={{ htmlInput: { maxLength: 9 } }}
        {...register("laborInsuranceUnitCode", {
          setValueAs: (value: string) => value.toUpperCase(),
        })}
      />
      <TextField
        fullWidth
        label={tAttendance("occupationalIndustryCode.label")}
        onChange={(event) =>
          setValue("occupationalIndustryCode", event.target.value)
        }
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const industry = occupationalIndustryRates.find(
                ({ code }) => code === selected,
              );

              return industry ? (
                industryLabel(industry)
              ) : (
                <em>{tAttendance("occupationalIndustryCode.none")}</em>
              );
            },
          },
        }}
        value={occupationalIndustryCode}
      >
        <MenuItem value="">
          <em>{tAttendance("occupationalIndustryCode.none")}</em>
        </MenuItem>
        {industryCategories.flatMap((category) => [
          <ListSubheader key={category}>{category}</ListSubheader>,
          ...occupationalIndustryRates
            .filter((industry) => industry.category === category)
            .map((industry) => (
              <MenuItem key={industry.code} value={industry.code}>
                {industryLabel(industry)}
              </MenuItem>
            )),
        ])}
      </TextField>
      <NumberSpinner
        clearable
        error={!!errors.occupationalExperienceRate}
        fullWidth
        helperText={
          errors.occupationalExperienceRate?.message ??
          tAttendance("occupationalExperienceRateMicros.helper")
        }
        label={tAttendance("occupationalExperienceRateMicros.label")}
        max={10}
        min={0.0001}
        onValueChange={(value) =>
          setValue("occupationalExperienceRate", value, {
            shouldValidate: isSubmitted,
          })
        }
        step={0.01}
        value={occupationalExperienceRate}
      />
      <DatePicker
        format={monthFormat}
        label={tAttendance("voluntaryLaborInsuranceFrom")}
        onChange={(value) =>
          setValue(
            "voluntaryLaborInsuranceFrom",
            value?.isValid() ? value.format("YYYY-MM") : "",
          )
        }
        slotProps={{
          field: { clearable: true },
          textField: { fullWidth: true },
        }}
        timezone={STORE_TIMEZONE}
        value={
          voluntaryLaborInsuranceFrom
            ? dayjs(voluntaryLaborInsuranceFrom, "YYYY-MM")
            : null
        }
        views={["year", "month"]}
      />
      <StyledFormControl component="fieldset" variant="standard">
        <FormLabel component="legend">
          {tAttendance("overtimeExtensionPeriods.label")}
        </FormLabel>
        <FormHelperText>
          {tAttendance("overtimeExtensionPeriods.hint")}
        </FormHelperText>
        {periodFields.map(({ id }, index) => (
          <IpRowStack direction="row" key={id}>
            <DatePicker
              format={monthFormat}
              label={tAttendance("overtimeExtensionPeriods.startMonth")}
              onChange={(value) =>
                setValue(
                  `overtimeExtensionPeriods.${index}.value`,
                  value?.isValid() ? value.format("YYYY-MM") : "",
                  { shouldValidate: isSubmitted },
                )
              }
              slotProps={{
                textField: {
                  error: !!errors.overtimeExtensionPeriods?.[index]?.value,
                  fullWidth: true,
                  helperText:
                    errors.overtimeExtensionPeriods?.[index]?.value?.message,
                },
              }}
              timezone={STORE_TIMEZONE}
              value={
                periods?.[index]?.value
                  ? dayjs(periods[index].value, "YYYY-MM")
                  : null
              }
              views={["year", "month"]}
            />
            <IconButton
              color="error"
              onClick={() => removePeriod(index)}
              size="small"
            >
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </IpRowStack>
        ))}
        <Button
          onClick={() => appendPeriod({ value: "" })}
          startIcon={<Add />}
          variant="outlined"
        >
          {tAttendance("add")}
        </Button>
      </StyledFormControl>
    </FormBox>
  );
};

export default SettingsDialog;
