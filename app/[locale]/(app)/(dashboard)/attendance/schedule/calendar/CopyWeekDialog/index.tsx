"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import {
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AttendanceCopyWeekResult } from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const MAX_WEEKS = 12;

const SkippedList = styled(List)({
  maxHeight: 320,
  overflowY: "auto",
});

interface CopyWeekForm {
  weeks: number;
}

interface CopyWeekDialogProps {
  from: string;
  onCopied: (result: AttendanceCopyWeekResult) => void;
  organizationSlug: string;
}

const CopyWeekDialog = ({
  from,
  onCopied,
  organizationSlug,
}: CopyWeekDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const { control, handleSubmit, register } = useForm<CopyWeekForm>({
    defaultValues: { weeks: 1 },
  });

  const weeks = useWatch({ control, name: "weeks" });

  const path = attendancePath(organizationSlug, "org", "shifts/copy-week");

  const copyWeek = (weeks: number, dryRun: boolean) =>
    fetcher<AttendanceCopyWeekResult>(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from, weeks, dryRun }),
    });

  const {
    data: preview,
    error,
    isLoading,
    mutate,
  } = useSWR([path, from, weeks], () => copyWeek(weeks, true), {
    onError: () => undefined,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  useEffect(() => {
    setDialog({ confirmDisabled: !preview?.created.length });
  }, [preview, setDialog]);

  const formatDate = (date: dayjs.Dayjs) =>
    format.dateTime(date.toDate(), "date", { timeZone: STORE_TIMEZONE });

  const sourceStart = dayjs.tz(from, STORE_TIMEZONE);

  const onSubmitHandler = async ({ weeks }: CopyWeekForm) => {
    try {
      setDialog({ confirmLoading: true });

      const result = await copyWeek(weeks, false);

      closeDialog();

      onCopied(result);
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });

      mutate();
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attendance-copy-week-form" onSubmit={onSubmit}>
      <TextField
        fullWidth
        helperText={tAttendance("copyWeek.target", {
          range: `${formatDate(sourceStart.add(7, "day"))} – ${formatDate(
            sourceStart.add(7 * (weeks + 1) - 1, "day"),
          )}`,
        })}
        label={tAttendance("copyWeek.weeks")}
        required
        select
        value={weeks}
        {...register("weeks")}
      >
        {Array.from({ length: MAX_WEEKS }, (_, index) => index + 1).map(
          (value) => (
            <MenuItem key={value} value={value}>
              {tAttendance("copyWeek.weeksOption", { weeks: value })}
            </MenuItem>
          ),
        )}
      </TextField>
      {isLoading && <LinearProgress />}
      {error && (
        <Typography color="error">
          {tAttendance(attendanceErrorKey(error))}
        </Typography>
      )}
      {preview && !preview.created.length && !preview.skipped.length && (
        <Typography>{tAttendance("copyWeek.empty")}</Typography>
      )}
      {preview && preview.created.length > 0 && (
        <Typography>
          {tAttendance("copyWeek.created", { count: preview.created.length })}
        </Typography>
      )}
      {preview && preview.skipped.length > 0 && (
        <>
          <Typography>
            {tAttendance("copyWeek.skipped", {
              count: preview.skipped.length,
            })}
          </Typography>
          <SkippedList dense disablePadding>
            {preview.skipped.map(
              ({ employeeName, endsAt, reason, sourceShiftId, startsAt }) => (
                <ListItem disableGutters key={`${sourceShiftId}-${startsAt}`}>
                  <ListItemText
                    primary={`${employeeName} · ${format.dateTime(
                      new Date(startsAt),
                      "shift",
                      { timeZone: STORE_TIMEZONE },
                    )} – ${format.dateTime(new Date(endsAt), "time", {
                      timeZone: STORE_TIMEZONE,
                    })}`}
                    secondary={tAttendance(`copyWeek.skipReasons.${reason}`)}
                  />
                </ListItem>
              ),
            )}
          </SkippedList>
        </>
      )}
    </FormBox>
  );
};

export default CopyWeekDialog;
