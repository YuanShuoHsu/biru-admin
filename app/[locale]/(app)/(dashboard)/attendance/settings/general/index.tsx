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

import type {
  AttendanceSettings,
  OccupationalIndustryRate,
} from "@/types/attendance";
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
  "occupationalIndustryCode",
  "occupationalExperienceRateMicros",
  "overtimeExtensionPeriods",
] as const satisfies readonly (keyof AttendanceSettings)[];

interface SettingsProps {
  occupationalIndustryRates: OccupationalIndustryRate[];
  organization: Organization;
  settings: AttendanceSettings | null;
}

const Settings = ({
  occupationalIndustryRates,
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
            occupationalIndustryRates={occupationalIndustryRates}
            organizationSlug={organizationSlug}
            settings={settings}
          />
        ),
        formId: "attendance-settings-form",
        open: true,
        title: tAttendance("settings.actions.update"),
      }),
    [
      occupationalIndustryRates,
      organizationSlug,
      setDialog,
      settings,
      tAttendance,
    ],
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

  const percent = (micros: number) =>
    format.number(micros / 1000000, {
      maximumFractionDigits: 6,
      style: "percent",
    });

  const settingValue = (
    {
      occupationalExperienceRateMicros,
      occupationalIndustryCode,
      ...values
    }: AttendanceSettings,
    key: (typeof SETTING_KEYS)[number],
  ) => {
    if (key === "overtimeExtensionPeriods")
      return values.overtimeExtensionPeriods.length
        ? chips(values.overtimeExtensionPeriods, periodLabel)
        : tAttendance("overtimeExtensionPeriods.none");

    if (key === "occupationalIndustryCode") {
      const industry = occupationalIndustryRates.find(
        ({ code }) => code === occupationalIndustryCode,
      );

      return industry
        ? `${industry.industry} · ${percent(industry.rateMicros)}`
        : (occupationalIndustryCode ??
            tAttendance("occupationalIndustryCode.none"));
    }

    if (key === "occupationalExperienceRateMicros")
      return occupationalExperienceRateMicros == null
        ? tAttendance("occupationalExperienceRateMicros.none")
        : percent(occupationalExperienceRateMicros);

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
