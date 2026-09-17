"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";

import { type CorrectionForm, useCorrectionFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import { Add, Delete } from "@mui/icons-material";
import {
  Alert,
  Button,
  IconButton,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceEventActionValues } from "@/types/api";
import type { AttendanceShift } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface CorrectionDialogProps {
  mutate: () => void;
  organizationSlug: string;
  shift: AttendanceShift;
}

const CorrectionDialog = ({
  mutate,
  organizationSlug,
  shift,
}: CorrectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const correctionFormSchema = useCorrectionFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<CorrectionForm>({
    defaultValues: {
      correctedEvents:
        shift.events.length >= 2
          ? shift.events.map(({ action, occurredAt }) => ({
              action,
              occurredAt,
            }))
          : [
              shift.events[0] ?? {
                action: "clockIn",
                occurredAt: shift.startsAt,
              },
              { action: "clockOut", occurredAt: shift.endsAt },
            ],
      reason: "",
    },
    resolver: zodResolver(correctionFormSchema),
  });

  const { append, fields, remove } = useFieldArray({
    control,
    name: "correctedEvents",
  });

  const correctedEvents = useWatch({ control, name: "correctedEvents" });

  const onSubmitHandler = async ({
    correctedEvents,
    reason,
  }: CorrectionForm) => {
    const sorted = [...correctedEvents].sort(
      (first, second) =>
        dayjs(first.occurredAt).valueOf() - dayjs(second.occurredAt).valueOf(),
    );

    try {
      setDialog({ confirmLoading: true });

      await fetcher(attendancePath(organizationSlug, "all", "requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "correction",
          shiftId: shift.id,
          reason,
          correctedEvents: sorted,
          startsAt: sorted[0].occurredAt,
          endsAt: sorted[sorted.length - 1].occurredAt,
        }),
      });

      enqueueSnackbar(tAttendance("success"), { variant: "success" });

      closeDialog();

      mutate();
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
    <FormBox id="attendance-correction-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("correctionHint")}</Alert>
      {fields.map(({ id }, index) => (
        <Stack alignItems="center" direction="row" gap={1} key={id}>
          <TextField
            error={!!errors.correctedEvents?.[index]?.action}
            fullWidth
            helperText={errors.correctedEvents?.[index]?.action?.message}
            label={tAttendance("actions")}
            select
            value={correctedEvents?.[index]?.action ?? ""}
            {...register(`correctedEvents.${index}.action`)}
          >
            {attendanceEventActionValues.map((value) => (
              <MenuItem key={value} value={value}>
                {tAttendance(`eventAction.options.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          <DateTimePicker
            disableFuture
            label={tAttendance("startsAt")}
            onChange={(date) =>
              setValue(
                `correctedEvents.${index}.occurredAt`,
                date?.isValid() ? date.toISOString() : "",
                { shouldValidate: isSubmitted },
              )
            }
            slotProps={{
              textField: {
                error: !!errors.correctedEvents?.[index]?.occurredAt,
                fullWidth: true,
                helperText:
                  errors.correctedEvents?.[index]?.occurredAt?.message,
              },
            }}
            timezone={STORE_TIMEZONE}
            value={
              correctedEvents?.[index]?.occurredAt
                ? dayjs(correctedEvents[index].occurredAt)
                : null
            }
          />
          <IconButton
            color="error"
            disabled={fields.length <= 2}
            onClick={() => remove(index)}
            size="small"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Stack>
      ))}
      {errors.correctedEvents?.message && (
        <Alert severity="error">{errors.correctedEvents.message}</Alert>
      )}
      <Button
        onClick={() =>
          append({ action: "breakStart", occurredAt: shift.startsAt })
        }
        size="small"
        startIcon={<Add />}
        sx={{ alignSelf: "flex-start" }}
      >
        {tAttendance("add")}
      </Button>
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("reason")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
    </FormBox>
  );
};

export default CorrectionDialog;
