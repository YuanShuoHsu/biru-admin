"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";

import DataGrid from "@/components/DataGrid";
import { renderEmptyableCell } from "@/components/EmptyCell";

import { REQUEST_STATUS_COLORS } from "@/constants/attendance";
import { DATA_GRID_PROPS } from "@/constants/dataGrid";

import { useRouter } from "@/i18n/navigation";

import { Undo } from "@mui/icons-material";
import {
  Chip,
  DialogContentText,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceParentalReturn } from "@/types/attendance";

import { attendancePath } from "@/utils/attendance";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface MyParentalReturnsProps {
  organizationSlug: string;
  parentalReturns: AttendanceParentalReturn[];
}

const MyParentalReturns = ({
  organizationSlug,
  parentalReturns,
}: MyParentalReturnsProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const router = useRouter();

  const tAttendance = useTranslations("attendance");

  const date = useCallback(
    (value: string) => format.dateTime(new Date(value), "date"),
    [format],
  );

  const handleWithdraw = useCallback(
    ({ employeeName, id }: AttendanceParentalReturn) =>
      setDialog({
        content: (
          <DialogContentText>
            {tAttendance.rich("parentalReturns.withdrawConfirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              name: employeeName,
            })}
          </DialogContentText>
        ),
        onConfirm: async () => {
          try {
            await fetcher(
              attendancePath(
                organizationSlug,
                "org",
                `return-requests/${id}/withdraw`,
              ),
              { method: "PATCH" },
            );

            enqueueSnackbar(
              tAttendance("parentalReturns.withdrawn", { name: employeeName }),
              { variant: "success" },
            );
            router.refresh();
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("withdraw"),
      }),
    [organizationSlug, router, setDialog, tAttendance],
  );

  const hasPending = parentalReturns.some(({ status }) => status === "pending");

  const columns = useMemo<GridColDef[]>(
    () => [
      ...(hasPending
        ? [
            {
              disableColumnMenu: true,
              disableExport: true,
              field: "actions",
              filterable: false,
              headerName: tAttendance("actions"),
              renderCell: ({
                row,
              }: GridRenderCellParams<AttendanceParentalReturn>) =>
                row.status === "pending" && (
                  <Tooltip title={tAttendance("withdraw")}>
                    <IconButton
                      onClick={() => handleWithdraw(row)}
                      size="small"
                    >
                      <Undo fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              resizable: false,
              sortable: false,
            },
          ]
        : []),
      {
        field: "returnsAt",
        headerName: tAttendance("returnsAt"),
        valueFormatter: (value: string) => date(value),
      },
      {
        field: "originalStartsAt",
        headerName: tAttendance("originalLeavePeriod"),
        valueGetter: (value: string, row: AttendanceParentalReturn) =>
          `${date(value)} – ${date(row.originalEndsAt)}`,
      },
      {
        field: "reason",
        headerName: tAttendance("reason.label"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
      {
        field: "status",
        headerName: tAttendance("status.label"),
        renderCell: ({
          row,
        }: GridRenderCellParams<AttendanceParentalReturn>) => (
          <Chip
            color={REQUEST_STATUS_COLORS[row.status]}
            label={tAttendance(`status.options.${row.status}`)}
            size="small"
          />
        ),
      },
      {
        field: "reviewReason",
        headerName: tAttendance("reviewReason"),
        maxWidth: 320,
        renderCell: renderEmptyableCell,
      },
    ],
    [date, handleWithdraw, hasPending, tAttendance],
  );

  return (
    <>
      <Typography component="h2" variant="h6">
        {tAttendance("parentalReturns.label")}
      </Typography>
      <DataGrid
        {...DATA_GRID_PROPS}
        columns={columns}
        disableColumnFilter
        hideFooter
        rows={parentalReturns}
      />
    </>
  );
};

export default MyParentalReturns;
