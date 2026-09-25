"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import EventsDialogContent from "../../EventsDialogContent";
import GenerateDialog from "../../GenerateDialog";
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
  AttendanceCalendarDayKinds,
  AttendanceEmployee,
  AttendanceRequest,
  AttendanceShift,
  AttendanceTemplate,
} from "@/types/attendance";
import type { Organization } from "@/types/organizations";

import {
  ATTENDANCE_AGENDA_DAYS,
  ATTENDANCE_CALENDAR_VIEWS,
  attendanceCalendarPath,
  attendanceCalendarRange,
  attendanceErrorKey,
  attendancePath,
  getStatutoryLeaveName,
  type AttendanceCalendarView,
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
  canReadLeaves: boolean;
  dayKinds: AttendanceCalendarDayKinds;
  employees: AttendanceEmployee[];
  leaves: AttendanceRequest[];
  organization: Organization;
  shifts: AttendanceShift[];
  date: string;
  templates: AttendanceTemplate[];
  view: AttendanceCalendarView;
}

const Calendar = ({
  canCancel,
  canCreate,
  canReadLeaves,
  date: initialDate,
  dayKinds: initialDayKinds,
  employees,
  leaves: initialLeaves,
  organization: { openingHours = "", slug: organizationSlug },
  shifts: initialShifts,
  templates,
  view: initialView,
}: CalendarProps) => {
  const { setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const updateQuery = useUpdateQuery();

  const [date, setDate] = useState(initialDate);

  const [view, setView] = useState(initialView);

  useEffect(() => {
    if (date !== initialDate || view !== initialView)
      updateQuery({ date, view });
  }, [date, initialDate, initialView, updateQuery, view]);

  const range = useMemo(
    () => attendanceCalendarRange(view, date),
    [date, view],
  );

  const from = range.from.toISOString();
  const to = range.to.toISOString();

  const { data: shifts = initialShifts, mutate } = useSWR(
    attendanceCalendarPath(organizationSlug, "shifts", from, to),
    (url: string) => fetcher<AttendanceShift[]>(url),
    { fallbackData: initialShifts },
  );

  const { data: { dayKinds, holidays } = initialDayKinds } = useSWR(
    attendanceCalendarPath(organizationSlug, "day-kinds", from, to),
    (url: string) => fetcher<AttendanceCalendarDayKinds>(url),
    { fallbackData: initialDayKinds },
  );

  const { data: leaves = initialLeaves } = useSWR(
    canReadLeaves
      ? attendanceCalendarPath(organizationSlug, "leaves", from, to)
      : null,
    (url: string) => fetcher<AttendanceRequest[]>(url),
    { fallbackData: initialLeaves },
  );

  const resources = useMemo<SchedulerResource[]>(
    () =>
      employees.map(({ id, name }, index) => {
        const hours = shifts
          .filter(({ employeeId }) => employeeId === id)
          .reduce(
            (total, shift) =>
              total +
              scheduledHours(shift, range.from.valueOf(), range.to.valueOf()),
            0,
          );

        return {
          eventColor: EMPLOYEE_COLORS[index % EMPLOYEE_COLORS.length],
          id,
          title: `${name} · ${tAttendance("schedule.scheduledHours", {
            hours: format.number(hours, { maximumFractionDigits: 2 }),
          })}`,
        };
      }),
    [employees, format, range, shifts, tAttendance],
  );

  const events = useMemo<SchedulerEvent[]>(
    () => [
      ...holidays.map(({ date, name }) => {
        const day = dayjs.tz(date, STORE_TIMEZONE).toISOString();

        return {
          allDay: true,
          color: "grey" as const,
          end: day,
          id: `holiday-${date}`,
          readOnly: true,
          start: day,
          title: name,
        };
      }),
      ...dayKinds.map(
        ({ date, dayKind, employeeId, employeeName, holidayName }) => {
          const day = dayjs.tz(date, STORE_TIMEZONE).toISOString();

          return {
            allDay: true,
            color: "grey" as const,
            end: day,
            id: `${dayKind}-${employeeId}-${date}`,
            readOnly: true,
            resource: employeeId,
            start: day,
            title: `${employeeName} · ${holidayName ?? tAttendance(`dayKind.options.${dayKind}`)}`,
          };
        },
      ),
      ...leaves.map((leave) => ({
        allDay: leave.calendarLeave,
        color: "red" as const,
        // 請假區間不含結束時刻，全天事件的 end 卻含當天，不減會多佔一天
        end: leave.calendarLeave
          ? dayjs(leave.endsAt).subtract(1, "ms").toISOString()
          : leave.endsAt,
        id: leave.id,
        readOnly: true,
        resource: leave.employeeId,
        start: leave.startsAt,
        title: `${leave.employeeName} · ${getStatutoryLeaveName(tAttendance, {
          name: leave.leaveTypeName ?? "",
          statutoryKind: leave.leaveTypeStatutoryKind ?? "custom",
        })}`,
      })),
      ...shifts
        .filter(({ status }) => status !== "cancelled")
        .map((shift) => ({
          ...(shift.dayKind !== "workday" && { color: "grey" as const }),
          end: shift.endsAt,
          id: shift.id,
          readOnly: true,
          resource: shift.employeeId,
          start: shift.startsAt,
          title: shift.employeeName,
        })),
    ],
    [dayKinds, holidays, leaves, shifts, tAttendance],
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
      nextTimeSpan: (view) =>
        tAttendance("schedule.nextTimeSpan", {
          days: ATTENDANCE_AGENDA_DAYS,
          view,
        }),
      openMenu: tAttendance("schedule.openMenu"),
      openSidePanel: tAttendance("schedule.openSidePanel"),
      preferencesMenu: tAttendance("schedule.preferences.label"),
      previousTimeSpan: (view) =>
        tAttendance("schedule.previousTimeSpan", {
          days: ATTENDANCE_AGENDA_DAYS,
          view,
        }),
      resourceAriaLabel: (name) =>
        tAttendance("schedule.employeeLabel", { name }),
      resourcesLabel: tAttendance("employee"),
      showEventDetails: tAttendance("schedule.showDetails"),
      showWeekNumber: tAttendance("schedule.preferences.showWeekNumber"),
      showWeekends: tAttendance("schedule.preferences.showWeekends"),
      today: tAttendance("schedule.today"),
      viewSpecificOptions: (view) =>
        tAttendance("schedule.preferences.viewOptions", { view }),
      weekAbbreviation: tAttendance("schedule.weekAbbreviation"),
      weekNumberAriaLabel: (weekNumber) =>
        tAttendance("schedule.weekNumber", { weekNumber }),
      ...Object.fromEntries(
        ATTENDANCE_CALENDAR_VIEWS.map((view) => [
          view,
          tAttendance(`schedule.views.${view}`),
        ]),
      ),
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
            from={from}
            mutate={mutate}
            organizationSlug={organizationSlug}
            templates={templates}
            to={range.to.subtract(1, "day").toISOString()}
          />
        ),
        formId: "attendance-template-generate-form",
        open: true,
        title: tAttendance("generate"),
      }),
    [from, mutate, organizationSlug, range, setDialog, tAttendance, templates],
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

  const visibleDate = useMemo(
    () => dayjs.tz(date, STORE_TIMEZONE).toDate(),
    [date],
  );

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
          defaultPreferences={{ ampm: false, weekStartsOn: 0 }}
          displayTimezone={STORE_TIMEZONE}
          events={events}
          localeText={localeText}
          onEventEditingStart={handleEventEditingStart}
          onViewChange={setView}
          onVisibleDateChange={(value) =>
            setDate(dayjs(value).tz(STORE_TIMEZONE).format("YYYY-MM-DD"))
          }
          // 隱藏空白日時議程會往後掃到半年，超出抓取的資料區間
          preferencesMenuConfig={{
            toggleAmpm: false,
            toggleEmptyDaysInAgenda: false,
          }}
          readOnly={!canCreate}
          resources={resources}
          view={view}
          views={[...ATTENDANCE_CALENDAR_VIEWS]}
          visibleDate={visibleDate}
        />
      </CalendarBox>
    </>
  );
};

export default Calendar;
