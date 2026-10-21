"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import type {
  AttendanceLeaveCase,
  AttendanceParentalChild,
} from "@/types/attendance";

import { formatLeaveDuration, getStatutoryLeaveName } from "@/utils/attendance";

interface MyLeaveCasesProps {
  leaveCases: AttendanceLeaveCase[];
  parentalChildren: AttendanceParentalChild[];
}

const MyLeaveCases = ({ leaveCases, parentalChildren }: MyLeaveCasesProps) => {
  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "leaveTypeName",
        headerName: tAttendance("leaveType.label"),
        valueGetter: (
          _,
          { leaveTypeName, leaveTypeStatutoryKind }: AttendanceLeaveCase,
        ) =>
          getStatutoryLeaveName(tAttendance, {
            name: leaveTypeName,
            statutoryKind: leaveTypeStatutoryKind,
          }),
      },
      {
        field: "reference",
        headerName: tAttendance("caseReference.label"),
        renderCell: renderEmptyableCell,
      },
      {
        field: "startsAt",
        headerName: tAttendance("startsAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "dateTime"),
      },
      {
        field: "endsAt",
        headerName: tAttendance("endsAt"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "dateTime"),
      },
      {
        field: "grantedMinutes",
        headerName: tAttendance("grantedMinutes"),
        type: "number",
        valueFormatter: (value: number, row: AttendanceLeaveCase) =>
          formatLeaveDuration(tAttendance, value, row.calendarLeave),
      },
      {
        field: "usedMinutes",
        headerName: tAttendance("usedMinutes"),
        type: "number",
        valueFormatter: (value: number, row: AttendanceLeaveCase) =>
          formatLeaveDuration(tAttendance, value, row.calendarLeave),
      },
      {
        field: "paidPercent",
        headerName: tAttendance("paidPercent"),
        type: "number",
      },
      {
        field: "childId",
        headerName: tAttendance("parentalChild"),
        renderCell: renderEmptyableCell,
        valueGetter: (value: string | null, row: AttendanceLeaveCase) =>
          row.leaveTypeStatutoryKind === "parental"
            ? (parentalChildren.find((child) => child.id === value)?.label ??
              tAttendance("errors.parentalChildUnassigned"))
            : null,
      },
      {
        field: "reason",
        headerName: tAttendance("reason.label"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
    ],
    [format, parentalChildren, tAttendance],
  );

  return (
    <>
      <Typography component="h2" variant="h6">
        {tAttendance("leaveCases.label")}
      </Typography>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        disableColumnFilter
        hideFooter
        rows={leaveCases}
      />
    </>
  );
};

export default MyLeaveCases;
