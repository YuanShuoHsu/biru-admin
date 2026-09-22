"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { type SettingsForm, useSettingsFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { ALLOWED_IPS_MAX } from "@/constants/attendance";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";

import { Add, DeleteOutline, MyLocation } from "@mui/icons-material";
import {
  Button,
  FormControl,
  type FormControlProps,
  FormHelperText,
  FormLabel,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceSettings } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const StyledFormControl = styled(FormControl)<FormControlProps>(
  ({ theme }) => ({
    gap: theme.spacing(2),
  }),
);

interface SettingsDialogProps {
  organizationSlug: string;
  settings: AttendanceSettings | null;
}

const SettingsDialog = ({
  organizationSlug,
  settings,
}: SettingsDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const [locating, setLocating] = useState(false);

  const router = useRouter();

  const tAttendance = useTranslations("attendance");

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
      latitude: settings?.latitude ?? null,
      longitude: settings?.longitude ?? null,
      radiusMeters: settings?.radiusMeters ?? 100,
    },
    resolver: zodResolver(settingsFormSchema),
  });

  const [graceMinutes, latitude, longitude, radiusMeters] = useWatch({
    control,
    name: ["graceMinutes", "latitude", "longitude", "radiusMeters"],
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "allowedIps",
  });

  const onSubmitHandler = async (values: SettingsForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          allowedIps: values.allowedIps.map(({ value }) => value.trim()),
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
      <Button
        loading={locating}
        onClick={handleUseCurrentLocation}
        startIcon={<MyLocation />}
        sx={{ alignSelf: "flex-start" }}
        variant="outlined"
      >
        {tAttendance("useCurrentLocation")}
      </Button>
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
          <Stack gap={0.5} key={id}>
            <Stack alignItems="center" direction="row" gap={1}>
              <TextField
                error={!!errors.allowedIps?.[index]?.value}
                fullWidth
                placeholder={tAttendance("allowedIps.placeholder")}
                required
                {...register(`allowedIps.${index}.value`)}
              />
              <IconButton
                color="error"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
                size="small"
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Stack>
            {errors.allowedIps?.[index]?.value && (
              <FormHelperText error>
                {errors.allowedIps[index].value.message}
              </FormHelperText>
            )}
          </Stack>
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
    </FormBox>
  );
};

export default SettingsDialog;
