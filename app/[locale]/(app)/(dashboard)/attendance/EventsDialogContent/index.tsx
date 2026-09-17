"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Stack, Typography } from "@mui/material";

import type { AttendanceShift } from "@/types/attendance";

interface EventsDialogContentProps {
  shift: AttendanceShift;
}

const EventsDialogContent = ({ shift }: EventsDialogContentProps) => {
  const format = useFormatter();
  const tAttendance = useTranslations("attendance");

  const date = (value: string) => format.dateTime(new Date(value), "short");

  return (
    <Stack gap={1}>
      <Typography variant="subtitle2">{tAttendance("events")}</Typography>
      {shift.events.map(({ action, occurredAt }, index) => (
        <Typography key={index}>
          {tAttendance(`eventAction.options.${action}`)} · {date(occurredAt)}
        </Typography>
      ))}
      <Typography variant="subtitle2">
        {tAttendance("originalEvents")}
      </Typography>
      {shift.originalEvents.map(({ action, occurredAt }, index) => (
        <Typography key={index}>
          {tAttendance(`eventAction.options.${action}`)} · {date(occurredAt)}
        </Typography>
      ))}
    </Stack>
  );
};

export default EventsDialogContent;
