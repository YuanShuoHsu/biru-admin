"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import SettingsDialog from "./SettingsDialog";

import DetailsCard from "@/components/DetailsCard";

import { Chip, Stack, Typography } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceSettings } from "@/types/attendance";

const SETTING_KEYS = [
  "latitude",
  "longitude",
  "radiusMeters",
  "allowedIps",
  "graceMinutes",
] as const satisfies readonly (keyof AttendanceSettings)[];

interface SettingsProps {
  organizationSlug: string;
  settings: AttendanceSettings | null;
}

const Settings = ({ organizationSlug, settings }: SettingsProps) => {
  const tAttendance = useTranslations("attendance");

  const { setDialog } = useDialogStore((state) => state);

  const handleUpdateSettings = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <SettingsDialog
            organizationSlug={organizationSlug}
            settings={settings}
          />
        ),
        formId: "attendance-settings-form",
        open: true,
        title: tAttendance("settings.actions.update"),
      }),
    [organizationSlug, setDialog, settings, tAttendance],
  );

  const items = settings
    ? SETTING_KEYS.map((key) => {
        const value = settings[key];

        return {
          key,
          label: tAttendance(`${key}.label`),
          value: Array.isArray(value) ? (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {value.map((ip) => (
                <Chip key={ip} label={ip} size="small" variant="outlined" />
              ))}
            </Stack>
          ) : (
            value
          ),
        };
      })
    : [];

  return (
    <DetailsCard
      action={{
        label: tAttendance("settings.actions.update"),
        onClick: handleUpdateSettings,
      }}
      items={items}
    >
      {!items.length && (
        <Typography color="text.secondary" variant="body2">
          {tAttendance("errors.settingsRequired")}
        </Typography>
      )}
    </DetailsCard>
  );
};

export default Settings;
