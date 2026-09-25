"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
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
  "laborInsuranceUnitCode",
  "occupationalAccidentRateMicros",
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
  const format = useFormatter();

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

  const settingValue = (
    { occupationalAccidentRateMicros, ...values }: AttendanceSettings,
    key: (typeof SETTING_KEYS)[number],
  ) => {
    if (key === "overtimeExtensionPeriods")
      return values.overtimeExtensionPeriods.length
        ? chips(values.overtimeExtensionPeriods, periodLabel)
        : tAttendance("overtimeExtensionPeriods.none");

    if (key === "occupationalAccidentRateMicros")
      return occupationalAccidentRateMicros == null
        ? tAttendance("occupationalAccidentRateMicros.none")
        : format.number(occupationalAccidentRateMicros / 1000000, {
            maximumFractionDigits: 6,
            style: "percent",
          });

    if (key === "laborInsuranceUnitCode")
      return (
        values.laborInsuranceUnitCode ??
        tAttendance("laborInsuranceUnitCode.none")
      );

    const value = values[key];

    return Array.isArray(value) ? chips(value) : value;
  };

  const items = settings
    ? SETTING_KEYS.map((key) => ({
        key,
        label: tAttendance(`${key}.label`),
        value: settingValue(settings, key),
      }))
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
