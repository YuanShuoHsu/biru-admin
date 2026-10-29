"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { closeSnackbar, enqueueSnackbar } from "notistack";
import { useCallback } from "react";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";

import { Button, DialogContentText } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceShift } from "@/types/attendance";

import { attendancePath } from "@/utils/attendance";
import { getErrorMessage } from "@/utils/errors";
import { type FetchError, fetcher } from "@/utils/fetcher";

import CancelShiftDialog from "@/app/[locale]/(app)/(dashboard)/attendance/CancelShiftDialog";

const irreversibleReason = (error: unknown) => {
  const info = (error as FetchError)?.info;

  return info?.code === "cancelIrreversible" &&
    "reasonMessage" in info &&
    typeof info.reasonMessage === "string"
    ? info.reasonMessage
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
                      enqueueSnackbar(getErrorMessage(error), {
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
    (shift: AttendanceShift, ruleMessage: string, reason?: string) =>
      setDialog({
        confirmText: tAttendance("cancelShift"),
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tAttendance.rich("cancelShiftIrreversible", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  name: shift.employeeName,
                  reason: ruleMessage,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        formId: undefined,
        onConfirm: async () => {
          try {
            await requestCancel(shift, reason, true);

            handleCancelled(shift, false);
          } catch (error) {
            enqueueSnackbar(getErrorMessage(error), {
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
        const ruleMessage = irreversibleReason(error);

        if (ruleMessage) {
          confirmIrreversible(shift, ruleMessage, reason);

          return;
        }

        enqueueSnackbar(getErrorMessage(error), {
          variant: "error",
        });
      }
    },
    [closeDialog, confirmIrreversible, handleCancelled, requestCancel],
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
