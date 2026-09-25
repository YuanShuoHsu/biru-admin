"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

import GenerateDialog from "../../GenerateDialog";
import EventsDialogContent from "../../EventsDialogContent";
import ShiftDialog from "../../ShiftDialog";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add } from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  EventCalendar,
  type EventCalendarProps,
} from "@mui/x-scheduler/event-calendar";
import type {
  SchedulerEvent,
  SchedulerEventColor,
  SchedulerResource,
} from "@mui/x-scheduler/models";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AttendanceEmployee,
  AttendanceShift,
  AttendanceTemplate,
} from "@/types/attendance";
import type { Organization } from "@/types/organizations";

import {
  attendanceCalendarPath,
  attendanceErrorKey,
  attendancePath,
  WEEK_DAYS,
  weekStart,
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";
import { scheduledHours } from "@/utils/scheduledHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const ToolbarStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
  justifyContent: "flex-end",
}));

const CalendarBox = styled(Box)({
  height: 720,
});

const EMPLOYEE_COLORS: SchedulerEventColor[] = [
  "teal",
  "indigo",
  "orange",
  "purple",
  "green",
  "pink",
  "blue",
  "amber",
  "lime",
];

interface CalendarProps {
  canCancel: boolean;
  canCreate: boolean;
  employees: AttendanceEmployee[];
  organization: Organization;
  shifts: AttendanceShift[];
  templates: AttendanceTemplate[];
  week: string;
}

const Calendar = ({
  canCancel,
  canCreate,
  employees,
  organization: { openingHours = "", slug: organizationSlug },
  shifts: initialShifts,
  templates,
  week,
}: CalendarProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const start = useMemo(() => dayjs.tz(week, STORE_TIMEZONE), [week]);

  const path = attendanceCalendarPath(
    organizationSlug,
    start.toISOString(),
    start.add(WEEK_DAYS, "day").toISOString(),
  );

  const { data: shifts = initialShifts, mutate } = useSWR(
    path,
    () => fetcher<AttendanceShift[]>(path),
    { fallbackData: initialShifts },
  );

  const resources = useMemo<SchedulerResource[]>(() => {
    const from = start.valueOf();
    const to = start.add(WEEK_DAYS, "day").valueOf();

    return employees.map(({ id, name }, index) => {
      const hours = shifts
        .filter(({ employeeId }) => employeeId === id)
        .reduce((total, shift) => total + scheduledHours(shift, from, to), 0);

      return {
        eventColor: EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length],
        id,
        title: `${name} · ${tAttendance("schedule.scheduledHours", {
          hours: format.number(hours, { maximumFractionDigits: 2 }),
        })}`,
      };
    });
  }, [employees, format, shifts, start, tAttendance]);

  const events = useMemo<SchedulerEvent[]>(
    () =>
      shifts
        .filter(({ status }) => status !== "cancelled")
        .map((shift) => ({
          ...(shift.dayKind !== "workday" && { color: "grey" }),
          end: shift.endsAt,
          id: shift.id,
          readOnly: true,
          resource: shift.employeeId,
          start: shift.startsAt,
          title: shift.employeeName,
        })),
    [shifts],
  );

  const localeText = useMemo<EventCalendarProps<object, object>["localeText"]>(
    () => ({
      allDay: tAttendance("schedule.allDay"),
      calendarContentAriaLabel: tAttendance("schedule.calendarContent"),
      closeSidePanel: tAttendance("schedule.closeSidePanel"),
      eventContextMenuAriaLabel: tAttendance("schedule.eventActions"),
      eventItemMultiDayLabel: (date) =>
        tAttendance("schedule.endsOn", { date }),
      hiddenEvents: (count) => tAttendance("schedule.moreEvents", { count }),
      miniCalendarGoToNextMonth: tAttendance("schedule.nextMonth"),
      miniCalendarGoToPreviousMonth: tAttendance("schedule.previousMonth"),
      miniCalendarLabel: tAttendance("schedule.miniCalendar"),
      nextTimeSpan: () => tAttendance("schedule.nextWeek"),
      openMenu: tAttendance("schedule.openMenu"),
      openSidePanel: tAttendance("schedule.openSidePanel"),
      previousTimeSpan: () => tAttendance("schedule.previousWeek"),
      resourceAriaLabel: (name) =>
        tAttendance("schedule.employeeLabel", { name }),
      resourcesLabel: tAttendance("employee"),
      showEventDetails: tAttendance("schedule.showDetails"),
      today: tAttendance("schedule.thisWeek"),
    }),
    [tAttendance],
  );

  const handleCreate = useCallback(
    (employeeId?: string, date?: string) =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <ShiftDialog
            date={date}
            employeeId={employeeId}
            employees={employees}
            mutate={mutate}
            openingHours={openingHours}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-shift-form",
        open: true,
        title: tAttendance("shifts.actions.create"),
      }),
    [employees, mutate, openingHours, organizationSlug, setDialog, tAttendance],
  );

  const handleApplyTemplate = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("save"),
        content: (
          <GenerateDialog
            from={start.toISOString()}
            mutate={mutate}
            organizationSlug={organizationSlug}
            templates={templates}
            to={start.add(WEEK_DAYS - 1, "day").toISOString()}
          />
        ),
        formId: "attendance-template-generate-form",
        open: true,
        title: tAttendance("generate"),
      }),
    [mutate, organizationSlug, setDialog, start, tAttendance, templates],
  );

  const handleViewEvents = useCallback(
    (shift: AttendanceShift) => {
      const cancellable = canCancel && shift.state === "scheduled";

      setDialog({
        confirmText: tAttendance("cancelShift"),
        content: <EventsDialogContent shift={shift} />,
        onConfirm: cancellable
          ? async () => {
              try {
                await fetcher(
                  `${attendancePath(organizationSlug, "org", "shifts")}/${shift.id}/cancel`,
                  { method: "PATCH" },
                );

                enqueueSnackbar(tAttendance("success"), {
                  variant: "success",
                });
                mutate();
              } catch (error) {
                enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
                  variant: "error",
                });
              }
            }
          : undefined,
        open: true,
        showConfirm: cancellable,
        title: tAttendance("events"),
      });
    },
    [canCancel, mutate, organizationSlug, setDialog, tAttendance],
  );

  const handleEventEditingStart = useCallback<
    NonNullable<EventCalendarProps<object, object>["onEventEditingStart"]>
  >(
    (_, eventDetails) => {
      eventDetails.cancel();

      if (eventDetails.reason === "creation") {
        const { displayTimezone, resource } = eventDetails.occurrence;

        handleCreate(
          typeof resource === "string" ? resource : undefined,
          dayjs(displayTimezone.start.value)
            .tz(STORE_TIMEZONE)
            .format("YYYY-MM-DD"),
        );
        return;
      }

      const shift = shifts.find(({ id }) => id === eventDetails.occurrence.id);

      if (shift) handleViewEvents(shift);
    },
    [handleCreate, handleViewEvents, shifts],
  );

  const visibleDate = useMemo(() => start.toDate(), [start]);

  return (
    <>
      {canCreate && (
        <ToolbarStack direction="row">
          <Button
            onClick={() => handleCreate()}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tAttendance("shifts.actions.create")}
          </Button>
          {templates.length > 0 && (
            <Button onClick={handleApplyTemplate} size="small">
              {tAttendance("schedule.applyTemplate")}
            </Button>
          )}
        </ToolbarStack>
      )}
      <CalendarBox>
        <EventCalendar
          areEventsDraggable={false}
          areEventsResizable={false}
          // 須與 weekStart() 的週日起算一致，否則畫面週與 URL 的 week 錯開
          defaultPreferences={{ ampm: false, weekStartsOn: 0 }}
          displayTimezone={STORE_TIMEZONE}
          events={events}
          localeText={localeText}
          onEventEditingStart={handleEventEditingStart}
          onVisibleDateChange={(value) =>
            updateQuery({
              week: weekStart(
                dayjs(value).tz(STORE_TIMEZONE).format("YYYY-MM-DD"),
              ),
            })
          }
          preferencesMenuConfig={false}
          readOnly={!canCreate}
          resources={resources}
          views={["week"]}
          visibleDate={visibleDate}
        />
      </CalendarBox>
    </>
  );
};

export default Calendar;
