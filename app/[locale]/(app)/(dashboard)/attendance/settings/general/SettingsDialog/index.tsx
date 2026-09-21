"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type SettingsForm, useSettingsFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { useRouter } from "@/i18n/navigation";

import { MyLocation } from "@mui/icons-material";
import { Alert, Button, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceSettings } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

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
      allowedIps: settings?.allowedIps.join("\n") ?? "",
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

  const onSubmitHandler = async (values: SettingsForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "org", "settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          allowedIps: values.allowedIps.split(/\s+/).filter(Boolean),
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
      <Alert severity="info">{tAttendance("ipHint")}</Alert>
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
        label={tAttendance("latitude")}
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
        label={tAttendance("longitude")}
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
        label={tAttendance("radiusMeters")}
        max={10000}
        min={10}
        onValueChange={(value) =>
          setValue("radiusMeters", value ?? 10, { shouldValidate: isSubmitted })
        }
        value={radiusMeters}
      />
      <TextField
        error={!!errors.allowedIps}
        fullWidth
        helperText={errors.allowedIps?.message}
        label={tAttendance("allowedIps")}
        minRows={3}
        multiline
        required
        {...register("allowedIps")}
      />
      <NumberSpinner
        error={!!errors.graceMinutes}
        fullWidth
        helperText={errors.graceMinutes?.message}
        label={tAttendance("graceMinutes")}
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
