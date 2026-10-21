"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useMemo } from "react";

import DataGrid from "@/components/DataGrid";

import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

import type { AttendanceParentalChild } from "@/types/attendance";

interface MyParentalChildrenProps {
  parentalChildren: AttendanceParentalChild[];
}

const MyParentalChildren = ({ parentalChildren }: MyParentalChildrenProps) => {
  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "label", headerName: tAttendance("childLabel") },
      { field: "reference", headerName: tAttendance("childReference") },
      {
        field: "birthDate",
        headerName: tAttendance("childBirthDate"),
        valueFormatter: (value: string) =>
          format.dateTime(new Date(value), "date"),
      },
    ],
    [format, tAttendance],
  );

  return (
    <>
      <Typography component="h2" variant="h6">
        {tAttendance("parentalChildren.label")}
      </Typography>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        disableColumnFilter
        hideFooter
        rows={parentalChildren}
      />
    </>
  );
};

export default MyParentalChildren;
