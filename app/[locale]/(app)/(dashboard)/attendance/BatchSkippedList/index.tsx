"use client";

import { useTranslations } from "next-intl";

import { List, ListItem, ListItemText } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { AttendanceBatchResult } from "@/types/attendance";

const StyledList = styled(List)({
  maxHeight: 320,
  overflowY: "auto",
});

interface BatchSkippedListProps {
  labels: Record<string, string>;
  skipped: AttendanceBatchResult["skipped"];
}

const BatchSkippedList = ({ labels, skipped }: BatchSkippedListProps) => {
  const tAttendance = useTranslations("attendance");

  return (
    <StyledList dense disablePadding>
      {skipped.map(({ id, reason }) => (
        <ListItem disableGutters key={id}>
          <ListItemText
            primary={labels[id]}
            secondary={tAttendance(`errors.${reason}`)}
          />
        </ListItem>
      ))}
    </StyledList>
  );
};

export default BatchSkippedList;
