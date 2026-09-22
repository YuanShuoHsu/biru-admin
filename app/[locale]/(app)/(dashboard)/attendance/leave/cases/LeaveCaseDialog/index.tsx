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
import NumberSpinner from "@/components/NumberSpinner";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Alert,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  AttendanceLeaveCase,
  AttendanceLeaveType,
  AttendanceParentalChild,
} from "@/types/attendance";

import {
  attendanceErrorKey,
  attendancePath,
  getStatutoryLeaveName,
  toCents,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

interface LeaveCaseDialogProps {
  canSetDailyPay: boolean;
  currency: string;
  employeeId?: string;
  employees: AttendanceEmployee[];
  leaveCase?: AttendanceLeaveCase;
  leaveTypes: AttendanceLeaveType[];
  mutate: () => void;
  organizationSlug: string;
  parentalChildren: AttendanceParentalChild[];
}

const LeaveCaseDialog = ({
  canSetDailyPay,
  currency,
  employeeId: selfEmployeeId,
  employees,
  leaveCase,
  leaveTypes,
  mutate,
  organizationSlug,
  parentalChildren,
}: LeaveCaseDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tAttendance = useTranslations("attendance");

  const leaveCaseFormSchema = useLeaveCaseFormSchema(leaveTypes);

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<LeaveCaseForm>({
    defaultValues: {
      childId: leaveCase?.childId ?? "",
      dailyPay: null,
      earlyParentalAgreed: false,
      employeeId: leaveCase?.employeeId ?? "",
      endsAt:
        leaveCase?.endsAt ??
        dayjs().tz(STORE_TIMEZONE).add(1, "month").startOf("day").toISOString(),
      eventDate:
        leaveCase?.eventDate ??
        dayjs().tz(STORE_TIMEZONE).startOf("day").toISOString(),
      extensionAgreed: false,
      leaveTypeId: leaveCase?.leaveTypeId ?? "",
      reason: leaveCase?.reason ?? "",
      reference: leaveCase?.reference ?? "",
      startsAt:
        leaveCase?.startsAt ??
        dayjs().tz(STORE_TIMEZONE).startOf("day").toISOString(),
    },
    resolver: zodResolver(leaveCaseFormSchema),
  });

  const [
    childId,
    dailyPay,
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
      "dailyPay",
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
  const isCalendarPaidLeave = !!leaveType?.calendarLeave && !isParentalLeave;

  const onSubmitHandler = async (values: LeaveCaseForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(
        attendancePath(
          organizationSlug,
          "org",
          leaveCase ? `leave-cases/${leaveCase.id}` : "leave-cases",
        ),
        {
          method: leaveCase ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: values.employeeId,
            endsAt: values.endsAt,
            leaveTypeId: values.leaveTypeId,
            reason: values.reason,
            reference: values.reference,
            startsAt: values.startsAt,
            ...(isParentalLeave
              ? {
                  childId: values.childId,
                  earlyParentalAgreed: values.earlyParentalAgreed,
                  eventDate: parentalChildren.find(
                    ({ id }) => id === values.childId,
                  )?.birthDate,
                }
              : { eventDate: values.eventDate }),
            ...(isMarriageLeave
              ? { extensionAgreed: values.extensionAgreed }
              : {}),
            ...(isCalendarPaidLeave && values.dailyPay !== null
              ? { dailyPayCents: toCents(values.dailyPay) }
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
    <FormBox id="attendance-leave-case-form" onSubmit={onSubmit}>
      <Alert severity="info">{tAttendance("leaveCaseHint")}</Alert>
      <TextField
        disabled={!!leaveCase}
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
        disabled={!!leaveCase}
        error={!!errors.leaveTypeId}
        fullWidth
        helperText={errors.leaveTypeId?.message}
        label={tAttendance("leaveType")}
        onChange={(event) => {
          setValue("leaveTypeId", event.target.value, {
            shouldValidate: isSubmitted,
          });

          setValue("childId", "");
          setValue("dailyPay", null);
          setValue("earlyParentalAgreed", false);
          setValue("extensionAgreed", false);
        }}
        required
        select
        value={leaveTypeId}
      >
        {leaveTypes
          .filter(
            ({ calendarLeave, enabled, eventLeave, statutoryKind }) =>
              enabled &&
              eventLeave &&
              (canSetDailyPay ||
                !calendarLeave ||
                statutoryKind === "parental"),
          )
          .map((leaveType) => (
            <MenuItem key={leaveType.id} value={leaveType.id}>
              {getStatutoryLeaveName(tAttendance, leaveType)}
            </MenuItem>
          ))}
      </TextField>
      <TextField
        error={!!errors.reference}
        fullWidth
        helperText={errors.reference?.message}
        label={tAttendance("caseReference")}
        required
        {...register("reference")}
      />
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
      {canSetDailyPay && isCalendarPaidLeave && (
        <NumberSpinner
          clearable
          error={!!errors.dailyPay}
          fullWidth
          helperText={errors.dailyPay?.message}
          label={tAttendance("dailyPayCents", { currency })}
          min={0}
          onValueChange={(value) =>
            setValue("dailyPay", value, { shouldValidate: isSubmitted })
          }
          step={0.01}
          value={dailyPay}
        />
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
        maxDate={endsAt ? dayjs(endsAt) : undefined}
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
        value={endsAt ? dayjs(endsAt) : null}
      />
      {isMarriageLeave && (
        <FormControlLabel
          control={
            <Checkbox
              checked={extensionAgreed}
              onChange={(_, checked) => setValue("extensionAgreed", checked)}
            />
          }
          label={tAttendance("extensionAgreed")}
          sx={{ alignSelf: "flex-start" }}
        />
      )}
      {isParentalLeave && (
        <FormControlLabel
          control={
            <Checkbox
              checked={earlyParentalAgreed}
              onChange={(_, checked) =>
                setValue("earlyParentalAgreed", checked)
              }
            />
          }
          label={tAttendance("earlyParentalAgreed")}
          sx={{ alignSelf: "flex-start" }}
        />
      )}
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

export default LeaveCaseDialog;
