"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import EventList from "../../../EventsDialogContent/EventList";
import { type ReviewForm, useReviewFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { attendanceEmergencyCauseValues } from "@/types/api";
import type {
  AttendanceLeaveType,
  AttendanceRequest,
} from "@/types/attendance";

import {
  attendanceErrorKey,
  attendancePath,
  formatScheduledShift,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const DetailStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const StyledTypography = styled(Typography)({
  fontWeight: "bold",
});

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

interface ReviewDialogProps {
  leaveTypes: AttendanceLeaveType[];
  mutate: () => void;
  organizationSlug: string;
  request: AttendanceRequest;
  status: "approved" | "rejected";
}

const ReviewDialog = ({
  leaveTypes,
  mutate,
  organizationSlug,
  request,
  status,
}: ReviewDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const reviewFormSchema = useReviewFormSchema();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ReviewForm>({
    defaultValues: {
      cause: "",
      emergencyWork: false,
      makeupEndsAt: "",
      makeupStartsAt: "",
      medicalCertified: false,
      reason: "",
      reportedAt: "",
    },
    resolver: zodResolver(reviewFormSchema),
  });

  const [
    cause,
    emergencyWork,
    makeupEndsAt,
    makeupStartsAt,
    medicalCertified,
    reportedAt,
  ] = useWatch({
    control,
    name: [
      "cause",
      "emergencyWork",
      "makeupEndsAt",
      "makeupStartsAt",
      "medicalCertified",
      "reportedAt",
    ],
  });

  const leaveType = leaveTypes.find(({ id }) => id === request.leaveTypeId);

  const isMedicalLeave =
    request.kind === "leave" &&
    status === "approved" &&
    request.status !== "cancellationPending" &&
    !!leaveType?.medicalCertificateRequired;

  const isOvertime = request.kind === "overtime" && status === "approved";

  const date = (value: string) => format.dateTime(new Date(value), "short");

  const onSubmitHandler = async (values: ReviewForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          `requests/${request.id}/review`,
        ),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: values.reason,
            status,
            ...(isMedicalLeave
              ? { medicalCertified: values.medicalCertified }
              : {}),
            ...(values.emergencyWork
              ? {
                  emergency: {
                    cause: values.cause,
                    makeupEndsAt: values.makeupEndsAt,
                    makeupStartsAt: values.makeupStartsAt,
                    reportedAt: values.reportedAt,
                  },
                }
              : {}),
          }),
        },
      );

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
    <FormBox id="attendance-review-form" onSubmit={onSubmit}>
      <StyledStack>
        <Typography>
          {request.employeeName} · {date(request.startsAt)} —{" "}
          {date(request.endsAt)}
        </Typography>
        <Typography>{request.reason}</Typography>
        {request.parentalMode && (
          <Typography variant="body2">
            {tAttendance(
              request.parentalMode === "daily"
                ? "parentalDaily"
                : "parentalContinuous",
            )}
          </Typography>
        )}
      </StyledStack>
      {request.correctedEvents && (
        <DetailStack divider={<Divider />}>
          {request.shiftStartsAt && request.shiftEndsAt && (
            <StyledStack>
              <StyledTypography color="textSecondary" variant="subtitle2">
                {tAttendance("scheduledTime")}
              </StyledTypography>
              <Typography variant="body2">
                {formatScheduledShift(format, {
                  endsAt: request.shiftEndsAt,
                  startsAt: request.shiftStartsAt,
                })}
              </Typography>
            </StyledStack>
          )}
          <EventList
            events={request.originalEvents ?? []}
            title={tAttendance("originalEvents")}
          />
          <EventList
            events={request.correctedEvents}
            title={tAttendance("kind.options.correction")}
          />
        </DetailStack>
      )}
      <TextField
        error={!!errors.reason}
        fullWidth
        helperText={errors.reason?.message}
        label={tAttendance("reviewReason")}
        minRows={3}
        multiline
        required
        {...register("reason")}
      />
      {isMedicalLeave && (
        <StyledFormControlLabel
          control={
            <Checkbox
              checked={medicalCertified}
              onChange={(_, checked) => setValue("medicalCertified", checked)}
            />
          }
          label={tAttendance("medicalCertified")}
        />
      )}
      {isOvertime && (
        <>
          <StyledFormControlLabel
            control={
              <Checkbox
                checked={emergencyWork}
                onChange={(_, checked) => setValue("emergencyWork", checked)}
              />
            }
            label={tAttendance("emergencyWork")}
          />
          {emergencyWork && (
            <>
              <TextField
                error={!!errors.cause}
                fullWidth
                helperText={errors.cause?.message}
                label={tAttendance("cause.label")}
                required
                select
                value={cause}
                {...register("cause")}
              >
                {attendanceEmergencyCauseValues.map((value) => (
                  <MenuItem key={value} value={value}>
                    {tAttendance(`cause.options.${value}`)}
                  </MenuItem>
                ))}
              </TextField>
              <DateTimePicker
                label={tAttendance("reportedAt")}
                onChange={(value) =>
                  setValue(
                    "reportedAt",
                    value?.isValid() ? value.toISOString() : "",
                    { shouldValidate: isSubmitted },
                  )
                }
                slotProps={{
                  textField: {
                    error: !!errors.reportedAt,
                    fullWidth: true,
                    helperText: errors.reportedAt?.message,
                  },
                }}
                timezone={STORE_TIMEZONE}
                value={reportedAt ? dayjs(reportedAt) : null}
              />
              <DateTimePicker
                label={tAttendance("makeupStartsAt")}
                maxDateTime={makeupEndsAt ? dayjs(makeupEndsAt) : undefined}
                onChange={(value) =>
                  setValue(
                    "makeupStartsAt",
                    value?.isValid() ? value.toISOString() : "",
                    { shouldValidate: isSubmitted },
                  )
                }
                slotProps={{
                  textField: {
                    error: !!errors.makeupStartsAt,
                    fullWidth: true,
                    helperText: errors.makeupStartsAt?.message,
                  },
                }}
                timezone={STORE_TIMEZONE}
                value={makeupStartsAt ? dayjs(makeupStartsAt) : null}
              />
              <DateTimePicker
                label={tAttendance("makeupEndsAt")}
                minDateTime={makeupStartsAt ? dayjs(makeupStartsAt) : undefined}
                onChange={(value) =>
                  setValue(
                    "makeupEndsAt",
                    value?.isValid() ? value.toISOString() : "",
                    { shouldValidate: isSubmitted },
                  )
                }
                slotProps={{
                  textField: {
                    error: !!errors.makeupEndsAt,
                    fullWidth: true,
                    helperText: errors.makeupEndsAt?.message,
                  },
                }}
                timezone={STORE_TIMEZONE}
                value={makeupEndsAt ? dayjs(makeupEndsAt) : null}
              />
            </>
          )}
        </>
      )}
    </FormBox>
  );
};

export default ReviewDialog;
