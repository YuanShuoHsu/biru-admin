"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import SettingsDialog from "./SettingsDialog";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceSettings } from "@/types/attendance";

const SETTING_KEYS = [
  "latitude",
  "longitude",
  "radiusMeters",
  "allowedIps",
  "graceMinutes",
] as const satisfies readonly (keyof AttendanceSettings)[];

const StyledButton = styled(Button)({
  alignSelf: "flex-start",
});

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

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
    <>
      <StyledButton onClick={handleUpdateSettings} variant="contained">
        {tAttendance("settings.actions.update")}
      </StyledButton>
      <Card variant="outlined">
        <StyledCardContent>
          {settings ? (
            <Grid container spacing={2}>
              {SETTING_KEYS.map((key) => {
                const value = settings[key];

                return (
                  <StyledGrid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography color="text.secondary" variant="body2">
                      {tAttendance(`${key}.label`)}
                    </Typography>
                    {Array.isArray(value) ? (
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {value.map((ip) => (
                          <Chip
                            key={ip}
                            label={ip}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body1">{value}</Typography>
                    )}
                  </StyledGrid>
                );
              })}
            </Grid>
          ) : (
            <Alert severity="warning">
              {tAttendance("errors.settingsRequired")}
            </Alert>
          )}
        </StyledCardContent>
      </Card>
    </>
  );
};

export default Settings;
