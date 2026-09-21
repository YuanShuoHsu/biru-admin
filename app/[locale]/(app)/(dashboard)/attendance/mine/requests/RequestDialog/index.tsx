"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import LeaveDialog from "../LeaveDialog";
import ShiftRequestDialog from "../ShiftRequestDialog";

import { MenuItem, Stack, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceRequestKindValues } from "@/types/api";
import type {
  AttendanceLeaveCase,
  AttendanceLeaveType,
  AttendanceRequestKind,
  AttendanceShift,
} from "@/types/attendance";

interface RequestDialogProps {
  correctableShifts: AttendanceShift[];
  leaveCases: AttendanceLeaveCase[];
  leaveTypes: AttendanceLeaveType[];
  mutate: () => void;
  organizationSlug: string;
  shifts: AttendanceShift[];
}

const RequestDialog = ({
  correctableShifts,
  leaveCases,
  leaveTypes,
  mutate,
  organizationSlug,
  shifts,
}: RequestDialogProps) => {
  const setDialog = useDialogStore((state) => state.setDialog);

  const tAttendance = useTranslations("attendance");

  const [kind, setKind] = useState<AttendanceRequestKind>("leave");

  const shiftRequestShifts = kind === "correction" ? correctableShifts : shifts;

  const handleKindChange = (value: AttendanceRequestKind) => {
    setKind(value);

    setDialog({
      confirmDisabled:
        value !== "leave" &&
        !(value === "correction" ? correctableShifts : shifts).length,
      formId: `attendance-${value}-form`,
    });
  };

  return (
    <Stack gap={2}>
      <TextField
        fullWidth
        label={tAttendance("kind.label")}
        onChange={(event) =>
          handleKindChange(event.target.value as AttendanceRequestKind)
        }
        required
        select
        value={kind}
      >
        {attendanceRequestKindValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tAttendance(`kind.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      {kind === "leave" ? (
        <LeaveDialog
          leaveCases={leaveCases}
          leaveTypes={leaveTypes}
          mutate={mutate}
          organizationSlug={organizationSlug}
        />
      ) : (
        <ShiftRequestDialog
          kind={kind}
          mutate={mutate}
          organizationSlug={organizationSlug}
          shifts={shiftRequestShifts}
        />
      )}
    </Stack>
  );
};

export default RequestDialog;
