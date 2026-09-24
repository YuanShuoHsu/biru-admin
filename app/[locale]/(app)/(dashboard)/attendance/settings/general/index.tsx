"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

import SettingsDialog from "./SettingsDialog";

import DetailsCard from "@/components/DetailsCard";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useMonthFormat } from "@/hooks/useMonthFormat";

import { Chip, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceSettings } from "@/types/attendance";
import type { Organization } from "@/types/organizations";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

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
  "overtimeExtensionPeriods",
] as const satisfies readonly (keyof AttendanceSettings)[];

interface SettingsProps {
  organization: Organization;
  settings: AttendanceSettings | null;
}

const Settings = ({
  organization: { slug: organizationSlug },
  settings,
}: SettingsProps) => {
  const monthFormat = useMonthFormat();

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

  const periodLabel = (month: string) => {
    const start = dayjs.tz(`${month}-01`, STORE_TIMEZONE);

    return [start, start.add(2, "month")]
      .map((month) => month.format(monthFormat))
      .join(" – ");
  };

  const chips = (values: string[], label = (value: string) => value) => (
    <StyledStack direction="row">
      {values.map((value) => (
        <Chip
          key={value}
          label={label(value)}
          size="small"
          variant="outlined"
        />
      ))}
    </StyledStack>
  );

  const items = settings
    ? SETTING_KEYS.map((key) => {
        const value = settings[key];

        return {
          key,
          label: tAttendance(`${key}.label`),
          value:
            key === "overtimeExtensionPeriods"
              ? settings.overtimeExtensionPeriods.length
                ? chips(settings.overtimeExtensionPeriods, periodLabel)
                : tAttendance("overtimeExtensionPeriods.none")
              : Array.isArray(value)
                ? chips(value)
                : value,
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
