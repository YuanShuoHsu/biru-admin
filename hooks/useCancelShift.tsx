"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { closeSnackbar, enqueueSnackbar } from "notistack";
import { useCallback } from "react";

import { Button } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceErrorCodeValues } from "@/types/api";
import type { AttendanceErrorCode, AttendanceShift } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { type FetchError, fetcher } from "@/utils/fetcher";

import CancelShiftDialog from "@/app/[locale]/(app)/(dashboard)/attendance/CancelShiftDialog";

const irreversibleRule = (error: unknown) => {
  const info = (error as FetchError)?.info;

  return info?.message === "cancelIrreversible" && "reason" in info
    ? attendanceErrorCodeValues.find((code) => code === info.reason)
    : undefined;
};

export const useCancelShift = (
  organizationSlug: string,
  mutate: () => void,
) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const shiftPath = useCallback(
    ({ id }: AttendanceShift) =>
      `${attendancePath(organizationSlug, "org", "shifts")}/${id}`,
    [organizationSlug],
  );

  const handleCancelled = useCallback(
    (shift: AttendanceShift, restorable: boolean) => {
      mutate();

      enqueueSnackbar(
        tAttendance("schedule.shiftCancelled", { name: shift.employeeName }),
        {
          action: restorable
            ? (key) => (
                <Button
                  color="inherit"
                  onClick={async () => {
                    closeSnackbar(key);

                    try {
                      await fetcher(`${shiftPath(shift)}/restore`, {
                        method: "PATCH",
                      });

                      enqueueSnackbar(
                        tAttendance("schedule.shiftRestored", {
                          name: shift.employeeName,
                        }),
                        { variant: "success" },
                      );
                    } catch (error) {
                      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
                        variant: "error",
                      });
                    }

                    mutate();
                  }}
                  size="small"
                >
                  {tAttendance("schedule.undo")}
                </Button>
              )
            : undefined,
          variant: "success",
        },
      );
    },
    [mutate, shiftPath, tAttendance],
  );

  const requestCancel = useCallback(
    (shift: AttendanceShift, reason?: string, irreversible = false) =>
      fetcher(`${shiftPath(shift)}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ irreversible, reason }),
      }),
    [shiftPath],
  );

  const confirmIrreversible = useCallback(
    (shift: AttendanceShift, rule: AttendanceErrorCode, reason?: string) =>
      setDialog({
        confirmText: tAttendance("cancelShift"),
        content: null,
        contentText: tAttendance("cancelShiftIrreversible", {
          reason: tAttendance(`errors.${rule}`),
        }),
        formId: undefined,
        onConfirm: async () => {
          try {
            await requestCancel(shift, reason, true);

            handleCancelled(shift, false);
          } catch (error) {
            enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("cancelShift"),
      }),
    [handleCancelled, requestCancel, setDialog, tAttendance],
  );

  const cancel = useCallback(
    async (shift: AttendanceShift, reason?: string) => {
      try {
        await requestCancel(shift, reason);

        closeDialog();

        handleCancelled(shift, true);
      } catch (error) {
        const rule = irreversibleRule(error);

        if (rule) {
          confirmIrreversible(shift, rule, reason);

          return;
        }

        enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
          variant: "error",
        });
      }
    },
    [
      closeDialog,
      confirmIrreversible,
      handleCancelled,
      requestCancel,
      tAttendance,
    ],
  );

  return useCallback(
    async (shift: AttendanceShift) => {
      if (dayjs(shift.startsAt).isAfter(dayjs())) {
        await cancel(shift);

        return;
      }

      setDialog({
        confirmText: tAttendance("cancelShift"),
        content: (
          <CancelShiftDialog
            onConfirm={(reason) => cancel(shift, reason)}
            shift={shift}
          />
        ),
        formId: "attendance-cancel-shift-form",
        open: true,
        title: tAttendance("cancelShift"),
      });
    },
    [cancel, setDialog, tAttendance],
  );
};
