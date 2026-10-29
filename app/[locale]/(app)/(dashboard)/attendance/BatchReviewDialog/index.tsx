"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, Fragment } from "react";
import { useForm, useWatch } from "react-hook-form";

import BatchSkippedList from "../BatchSkippedList";
import { type BatchReviewForm, useBatchReviewFormSchema } from "./definitions";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  AlertTitle,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormHelperText,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceBatchResult,
  PayrollViolation,
} from "@/types/attendance";

import { fetcher } from "@/utils/fetcher";
import { getErrorMessage } from "@/utils/errors";

interface BatchReviewDialogProps {
  labels: Record<string, string>;
  method: "PATCH" | "POST";
  mutate: () => void;
  path: string;
  status?: "approved" | "rejected";
  succeededMessage?: (count: number) => string;
  violations?: Record<string, PayrollViolation[]>;
}

const BatchReviewDialog = ({
  labels,
  method,
  mutate,
  path,
  status,
  succeededMessage,
  violations,
}: BatchReviewDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const violationEntries = Object.entries(violations ?? {}).filter(
    ([, codes]) => codes.length,
  );
  const acknowledgedViolations = [
    ...new Set(violationEntries.flatMap(([, codes]) => codes)),
  ];

  const batchReviewFormSchema = useBatchReviewFormSchema({
    acknowledgementRequired: acknowledgedViolations.length > 0,
    reasonRequired: status === "rejected",
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<BatchReviewForm>({
    defaultValues: { acknowledged: false, reason: "" },
    resolver: zodResolver(batchReviewFormSchema),
  });

  const acknowledged = useWatch({ control, name: "acknowledged" });

  const onSubmitHandler = async ({ reason }: BatchReviewForm) => {
    try {
      setDialog({ confirmLoading: true });

      const { skipped, succeeded } = await fetcher<AttendanceBatchResult>(
        path,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: Object.keys(labels),
            reason,
            status,
            ...(acknowledgedViolations.length && { acknowledgedViolations }),
          }),
        },
      );

      if (succeeded.length)
        enqueueSnackbar(
          succeededMessage?.(succeeded.length) ??
            tAttendance("batch.succeeded", { count: succeeded.length }),
          { variant: "success" },
        );

      mutate();

      if (skipped.length)
        setDialog({
          confirmLoading: false,
          content: (
            <>
              <CustomizedDialogContent>
                <BatchSkippedList labels={labels} skipped={skipped} />
              </CustomizedDialogContent>
              <CustomizedDialogActions />
            </>
          ),
          formId: undefined,
          showConfirm: false,
          title: tAttendance("batch.skipped", { count: skipped.length }),
        });
      else closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <>
      <CustomizedDialogContent>
        <FormBox id="attendance-batch-review-form" onSubmit={onSubmit}>
          {violationEntries.length > 0 && (
            <Alert severity="warning">
              <AlertTitle>{tAttendance("payroll.violations")}</AlertTitle>
              {violationEntries.map(([id, codes]) => (
                <Fragment key={id}>
                  <Typography variant="subtitle2">{labels[id]}</Typography>
                  {codes.map((code) => (
                    <Typography key={code} variant="body2">
                      {tAttendance(`errors.${code}`)}
                    </Typography>
                  ))}
                </Fragment>
              ))}
            </Alert>
          )}
          <TextField
            error={!!errors.reason}
            fullWidth
            helperText={errors.reason?.message}
            label={tAttendance("reviewReason")}
            minRows={3}
            multiline
            required={status === "rejected"}
            {...register("reason")}
          />
          {violationEntries.length > 0 && (
            <FormControl error={!!errors.acknowledged}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={acknowledged}
                    onChange={(_, checked) =>
                      setValue("acknowledged", checked, {
                        shouldValidate: true,
                      })
                    }
                  />
                }
                label={tAttendance("payroll.acknowledgeViolations")}
              />
              {errors.acknowledged && (
                <FormHelperText>{errors.acknowledged.message}</FormHelperText>
              )}
            </FormControl>
          )}
        </FormBox>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default BatchReviewDialog;
