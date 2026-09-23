"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import SettingsDialog from "./SettingsDialog";

import DetailsCard from "@/components/DetailsCard";

import { Chip, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceSettings } from "@/types/attendance";

const StyledStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  gap: theme.spacing(1),
}));

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
            <StyledStack direction="row">
              {value.map((ip) => (
                <Chip key={ip} label={ip} size="small" variant="outlined" />
              ))}
            </StyledStack>
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
      empty={tAttendance("settings.empty")}
      items={items}
    />
  );
};

export default Settings;
