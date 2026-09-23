"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { AttendanceShift } from "@/types/attendance";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

interface EventsDialogContentProps {
  shift: AttendanceShift;
}

const EventsDialogContent = ({ shift }: EventsDialogContentProps) => {
  const format = useFormatter();
  const tAttendance = useTranslations("attendance");

  const date = (value: string) => format.dateTime(new Date(value), "short");

  return (
    <StyledStack>
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
    </StyledStack>
  );
};

export default EventsDialogContent;
