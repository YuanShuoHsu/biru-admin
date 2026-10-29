"use client";

import { useTranslations } from "next-intl";

import EventList from "./EventList";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";

import { Divider, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { AttendanceShift } from "@/types/attendance";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

interface EventsDialogContentProps {
  shift: AttendanceShift;
}

const EventsDialogContent = ({ shift }: EventsDialogContentProps) => {
  const tAttendance = useTranslations("attendance");

  return (
    <>
      <CustomizedDialogContent>
        {shift.originalEvents ? (
          <StyledStack divider={<Divider />}>
            <EventList
              events={shift.originalEvents}
              title={tAttendance("originalEvents")}
            />
            <EventList
              events={shift.events}
              title={tAttendance("effectiveEvents")}
            />
          </StyledStack>
        ) : (
          <EventList events={shift.events} />
        )}
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default EventsDialogContent;
