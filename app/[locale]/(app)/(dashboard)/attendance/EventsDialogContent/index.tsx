"use client";

import { useFormatter, useTranslations } from "next-intl";

import EmptyCell from "@/components/EmptyCell";

import { Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { AttendanceEvent, AttendanceShift } from "@/types/attendance";

const DetailStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const SectionStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const BoldTypography = styled(Typography)({
  fontWeight: "bold",
});

const InfoRowStack = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface EventsSectionProps {
  events: AttendanceEvent[];
  title: string;
}

const EventsSection = ({ events, title }: EventsSectionProps) => {
  const format = useFormatter();
  const tAttendance = useTranslations("attendance");

  return (
    <SectionStack>
      <BoldTypography color="textSecondary" variant="subtitle2">
        {title}
      </BoldTypography>
      {events.length === 0 ? (
        <Typography variant="body2">
          <EmptyCell />
        </Typography>
      ) : (
        events.map(({ action, occurredAt }, index) => (
          <InfoRowStack key={index} direction="row">
            <Typography color="textSecondary" variant="body2">
              {tAttendance(`eventAction.options.${action}`)}
            </Typography>
            <Typography variant="body2">
              {format.dateTime(new Date(occurredAt), "short")}
            </Typography>
          </InfoRowStack>
        ))
      )}
    </SectionStack>
  );
};

interface EventsDialogContentProps {
  shift: AttendanceShift;
}

const EventsDialogContent = ({ shift }: EventsDialogContentProps) => {
  const tAttendance = useTranslations("attendance");

  return (
    <DetailStack divider={<Divider />}>
      <EventsSection
        events={shift.events}
        title={tAttendance("effectiveEvents")}
      />
      <EventsSection
        events={shift.originalEvents}
        title={tAttendance("originalEvents")}
      />
    </DetailStack>
  );
};

export default EventsDialogContent;
