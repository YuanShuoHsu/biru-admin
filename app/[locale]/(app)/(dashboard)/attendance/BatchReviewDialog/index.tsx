"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import BatchSkippedList from "../BatchSkippedList";
import { type BatchReviewForm, useBatchReviewFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceBatchResult } from "@/types/attendance";

import { attendanceErrorKey } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

interface BatchReviewDialogProps {
  labels: Record<string, string>;
  method: "PATCH" | "POST";
  mutate: () => void;
  path: string;
  status?: "approved" | "rejected";
  succeededMessage?: (count: number) => string;
}

const BatchReviewDialog = ({
  labels,
  method,
  mutate,
  path,
  status,
  succeededMessage,
}: BatchReviewDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const batchReviewFormSchema = useBatchReviewFormSchema(status === "rejected");

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<BatchReviewForm>({
    defaultValues: { reason: "" },
    resolver: zodResolver(batchReviewFormSchema),
  });

  const onSubmitHandler = async ({ reason }: BatchReviewForm) => {
    try {
      setDialog({ confirmLoading: true });

      const { skipped, succeeded } = await fetcher<AttendanceBatchResult>(
        path,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Object.keys(labels), reason, status }),
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
          content: <BatchSkippedList labels={labels} skipped={skipped} />,
          formId: undefined,
          showConfirm: false,
          title: tAttendance("batch.skipped", { count: skipped.length }),
        });
      else closeDialog();
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-batch-review-form" onSubmit={onSubmit}>
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
    </FormBox>
  );
};

export default BatchReviewDialog;
