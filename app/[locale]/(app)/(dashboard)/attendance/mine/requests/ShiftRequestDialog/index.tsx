"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import CorrectionDialog from "../../../CorrectionDialog";
import OvertimeDialog from "../../../OvertimeDialog";

import { Alert, MenuItem, Stack, TextField } from "@mui/material";

import type { AttendanceShift } from "@/types/attendance";

interface ShiftRequestDialogProps {
  kind: "correction" | "overtime";
  mutate: () => void;
  organizationSlug: string;
  shifts: AttendanceShift[];
}

const ShiftRequestDialog = ({
  kind,
  mutate,
  organizationSlug,
  shifts,
}: ShiftRequestDialogProps) => {
  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const [shiftId, setShiftId] = useState(shifts[0]?.id ?? "");

  const shift = shifts.find(({ id }) => id === shiftId);

  const date = (value: string) => format.dateTime(new Date(value), "short");

  if (!shift)
    return (
      <Alert severity="info">
        {tAttendance(
          kind === "correction" ? "noCorrectableShifts" : "noShifts",
        )}
      </Alert>
    );

  return (
    <Stack gap={2}>
      <TextField
        fullWidth
        label={tAttendance("shift")}
        onChange={(event) => setShiftId(event.target.value)}
        required
        select
        value={shiftId}
      >
        {shifts.map(({ endsAt, id, startsAt }) => (
          <MenuItem key={id} value={id}>
            {date(startsAt)} — {date(endsAt)}
          </MenuItem>
        ))}
      </TextField>
      {kind === "correction" ? (
        <CorrectionDialog
          key={shift.id}
          mutate={mutate}
          organizationSlug={organizationSlug}
          shift={shift}
        />
      ) : (
        <OvertimeDialog
          key={shift.id}
          mutate={mutate}
          organizationSlug={organizationSlug}
          shift={shift}
        />
      )}
    </Stack>
  );
};

export default ShiftRequestDialog;
