"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import SettingsDialog from "./SettingsDialog";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceSettings } from "@/types/attendance";

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

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack gap={2}>
          {settings ? (
            <>
              <Typography>
                {tAttendance("latitude")}: {settings.latitude} ·{" "}
                {tAttendance("longitude")}: {settings.longitude} ·{" "}
                {tAttendance("radiusMeters")}: {settings.radiusMeters}
              </Typography>
              <Typography>
                {tAttendance("settings.allowedIps")}:{" "}
                {settings.allowedIps.join(", ")}
              </Typography>
              <Typography>
                {tAttendance("graceMinutes")}: {settings.graceMinutes}
              </Typography>
            </>
          ) : (
            <Alert severity="warning">
              {tAttendance("errors.settingsRequired")}
            </Alert>
          )}
          <Button
            onClick={handleUpdateSettings}
            sx={{ alignSelf: "flex-start" }}
            variant="contained"
          >
            {tAttendance("settings.actions.update")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default Settings;
