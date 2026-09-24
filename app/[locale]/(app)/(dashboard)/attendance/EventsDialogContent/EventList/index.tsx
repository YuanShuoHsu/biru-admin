import { useFormatter, useTranslations } from "next-intl";

import EmptyCell from "@/components/EmptyCell";

import { Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { AttendanceEvent } from "@/types/attendance";

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const RowStack = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface EventListProps {
  events: AttendanceEvent[];
  title?: string;
}

const EventList = ({ events, title }: EventListProps) => {
  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  return (
    <StyledStack>
      {title && (
        <StyledTypography color="textSecondary" variant="subtitle2">
          {title}
        </StyledTypography>
      )}
      {events.length ? (
        events.map(({ action, occurredAt }, index) => (
          <RowStack key={index} direction="row">
            <Typography color="textSecondary" variant="body2">
              {tAttendance(`eventAction.options.${action}`)}
            </Typography>
            <Typography variant="body2">
              {format.dateTime(new Date(occurredAt), "short")}
            </Typography>
          </RowStack>
        ))
      ) : (
        <Typography variant="body2">
          <EmptyCell />
        </Typography>
      )}
    </StyledStack>
  );
};

export default EventList;
