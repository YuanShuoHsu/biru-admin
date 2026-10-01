"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type LeaveCaseForm, useLeaveCaseFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  AttendanceLeaveCase,
  AttendanceLeaveType,
  AttendanceParentalChild,
  AttendanceRequest,
} from "@/types/attendance";

import {
  attendanceErrorKey,
  attendancePath,
  getStatutoryLeaveName,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledFormControlLabel = styled(FormControlLabel)({
  alignSelf: "flex-start",
});

interface LeaveCaseDialogProps {
  employeeId?: string;
  employees: AttendanceEmployee[];
  leaveCase?: AttendanceLeaveCase;
  leaveTypes: AttendanceLeaveType[];
  mutate: () => void;
  organizationSlug: string;
  parentalChildren: AttendanceParentalChild[];
  request?: AttendanceRequest;
}

const LeaveCaseDialog = ({
  employeeId: selfEmployeeId,
  employees,
  leaveCase,
  leaveTypes,
  mutate,
  organizationSlug,
  parentalChildren,
  request,
}: LeaveCaseDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const leaveCaseFormSchema = useLeaveCaseFormSchema(leaveTypes);

  const requestDay = dayjs(request?.startsAt)
    .tz(STORE_TIMEZONE)
    .startOf("day")
    .toISOString();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<LeaveCaseForm>({
    defaultValues: {
      childId: leaveCase?.childId ?? "",
      earlyParentalAgreed: false,
      employeeId: leaveCase?.employeeId ?? request?.employeeId ?? "",
      endsAt:
        leaveCase?.endsAt ??
        (request
          ? dayjs(request.endsAt).subtract(1, "millisecond").add(1, "day")
          : dayjs().add(1, "month")
        )
          .tz(STORE_TIMEZONE)
          .startOf("day")
          .toISOString(),
      eventDate: leaveCase?.eventDate ?? requestDay,
      extensionAgreed: false,
      leaveTypeId: leaveCase?.leaveTypeId ?? request?.leaveTypeId ?? "",
      reason: leaveCase?.reason ?? request?.reason ?? "",
      reference: leaveCase?.reference ?? "",
      startsAt: leaveCase?.startsAt ?? requestDay,
    },
    resolver: zodResolver(leaveCaseFormSchema),
  });

  const [
    childId,
    earlyParentalAgreed,
    employeeId,
    endsAt,
    eventDate,
    extensionAgreed,
    leaveTypeId,
    startsAt,
  ] = useWatch({
    control,
    name: [
      "childId",
      "earlyParentalAgreed",
      "employeeId",
      "endsAt",
      "eventDate",
      "extensionAgreed",
      "leaveTypeId",
      "startsAt",
    ],
  });

  const leaveType = leaveTypes.find(({ id }) => id === leaveTypeId);

  const isParentalLeave = leaveType?.statutoryKind === "parental";
  const isMarriageLeave = leaveType?.statutoryKind === "marriage";
  const fixedCalendarDays = leaveType?.fixedCalendarDays ?? null;
  const shownEndsAt =
    fixedCalendarDays && startsAt
      ? dayjs(startsAt).tz(STORE_TIMEZONE).add(fixedCalendarDays, "day")
      : endsAt
        ? dayjs(endsAt)
        : null;

  const onSubmitHandler = async (values: LeaveCaseForm) => {
    try {
      setDialog({ confirmLoading: true });

      const leaveCaseValues = {
        ...(!fixedCalendarDays && { endsAt: values.endsAt }),
        startsAt: values.startsAt,
        ...(isParentalLeave
          ? {
              childId: values.childId,
              earlyParentalAgreed: values.earlyParentalAgreed,
            }
          : { eventDate: values.eventDate, reference: values.reference }),
        ...(isMarriageLeave ? { extensionAgreed: values.extensionAgreed } : {}),
      };

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          request
            ? `requests/${request.id}/review`
            : leaveCase
              ? `leave-cases/${leaveCase.id}`
              : "leave-cases",
        ),
        {
          method: request || leaveCase ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            request
              ? { leaveCase: leaveCaseValues, status: "approved" }
              : {
                  ...leaveCaseValues,
                  employeeId: values.employeeId,
                  leaveTypeId: values.leaveTypeId,
                  reason: values.reason,
                },
          ),
        },
      );

      const leaveTypeName = leaveType
        ? getStatutoryLeaveName(tAttendance, leaveType)
        : "";

      enqueueSnackbar(
        request
          ? tAttendance("reviews.approved", {
              employee: request.employeeName,
              name: leaveTypeName,
            })
          : tAttendance(
              leaveCase ? "leaveCases.updated" : "leaveCases.created",
              {
                leaveType: leaveTypeName,
                name:
                  employees.find(({ id }) => id === values.employeeId)?.name ??
                  "",
              },
            ),
        { variant: "success" },
      );

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
    <FormBox id="attendance-leave-case-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("leaveCaseHint")}</Alert>
      <TextField
        disabled={!!leaveCase || !!request}
        error={!!errors.employeeId}
        fullWidth
        helperText={errors.employeeId?.message}
        label={tAttendance("employee")}
        onChange={(event) => {
          setValue("employeeId", event.target.value, {
            shouldValidate: isSubmitted,
          });

          setValue("childId", "");
        }}
        required
        select
        value={employeeId}
      >
        {employees
          .filter(({ id }) => id !== selfEmployeeId)
          .map(({ id, name }) => (
            <MenuItem key={id} value={id}>
              {name}
            </MenuItem>
          ))}
      </TextField>
      <TextField
        disabled={!!leaveCase || !!request}
        error={!!errors.leaveTypeId}
        fullWidth
        helperText={errors.leaveTypeId?.message}
        label={tAttendance("leaveType.label")}
        onChange={(event) => {
          setValue("leaveTypeId", event.target.value, {
            shouldValidate: isSubmitted,
          });

          setValue("childId", "");
          setValue("earlyParentalAgreed", false);
          setValue("extensionAgreed", false);
        }}
        required
        select
        value={leaveTypeId}
      >
        {leaveTypes
          .filter(({ enabled, eventLeave }) => enabled && eventLeave)
          .map((leaveType) => (
            <MenuItem key={leaveType.id} value={leaveType.id}>
              {getStatutoryLeaveName(tAttendance, leaveType)}
            </MenuItem>
          ))}
      </TextField>
      {!isParentalLeave && (
        <TextField
          error={!!errors.reference}
          fullWidth
          helperText={errors.reference?.message}
          label={tAttendance("caseReference")}
          required
          {...register("reference")}
        />
      )}
      {isParentalLeave && (
        <TextField
          error={!!errors.childId}
          fullWidth
          helperText={errors.childId?.message}
          label={tAttendance("parentalChild")}
          onChange={(event) =>
            setValue("childId", event.target.value, {
              shouldValidate: isSubmitted,
            })
          }
          required
          select
          value={childId}
        >
          {parentalChildren
            .filter((child) => child.employeeId === employeeId)
            .map(({ id, label, reference }) => (
              <MenuItem key={id} value={id}>
                {label} · {reference}
              </MenuItem>
            ))}
        </TextField>
      )}
      {!isParentalLeave && (
        <DatePicker
          label={tAttendance("eventDate")}
          onChange={(value) =>
            setValue(
              "eventDate",
              value?.isValid() ? value.startOf("day").toISOString() : "",
              { shouldValidate: isSubmitted },
            )
          }
          slotProps={{
            textField: {
              error: !!errors.eventDate,
              fullWidth: true,
              helperText: errors.eventDate?.message,
            },
          }}
          timezone={STORE_TIMEZONE}
          value={eventDate ? dayjs(eventDate) : null}
        />
      )}
      <DatePicker
        label={tAttendance("startsAt")}
        maxDate={fixedCalendarDays || !endsAt ? undefined : dayjs(endsAt)}
        onChange={(value) =>
          setValue(
            "startsAt",
            value?.isValid() ? value.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.startsAt,
            fullWidth: true,
            helperText: errors.startsAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={startsAt ? dayjs(startsAt) : null}
      />
      <DatePicker
        disabled={!!fixedCalendarDays}
        label={tAttendance("endsAt")}
        minDate={startsAt ? dayjs(startsAt) : undefined}
        onChange={(value) =>
          setValue(
            "endsAt",
            value?.isValid() ? value.startOf("day").toISOString() : "",
            { shouldValidate: isSubmitted },
          )
        }
        slotProps={{
          textField: {
            error: !!errors.endsAt,
            fullWidth: true,
            helperText: errors.endsAt?.message,
          },
        }}
        timezone={STORE_TIMEZONE}
        value={shownEndsAt}
      />
      {isMarriageLeave && (
        <StyledFormControlLabel
          control={
            <Checkbox
              checked={extensionAgreed}
              onChange={(_, checked) => setValue("extensionAgreed", checked)}
            />
          }
          label={tAttendance("extensionAgreed")}
        />
      )}
      {isParentalLeave && (
        <StyledFormControlLabel
          control={
            <Checkbox
              checked={earlyParentalAgreed}
              onChange={(_, checked) =>
                setValue("earlyParentalAgreed", checked)
              }
            />
          }
          label={tAttendance("earlyParentalAgreed")}
        />
      )}
      {!request && (
        <TextField
          error={!!errors.reason}
          fullWidth
          helperText={errors.reason?.message}
          label={tAttendance("reason.label")}
          minRows={3}
          multiline
          required
          {...register("reason")}
        />
      )}
    </FormBox>
  );
};

export default LeaveCaseDialog;
