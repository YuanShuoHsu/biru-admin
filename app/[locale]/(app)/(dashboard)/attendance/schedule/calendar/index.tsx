"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useFormatter, useTranslations } from "next-intl";
import { closeSnackbar, enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import CopyWeekDialog from "./CopyWeekDialog";
import DayKindDialog from "./DayKindDialog";

import EventsDialogContent from "../../EventsDialogContent";
import ShiftDialog from "../../ShiftDialog";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, ContentCopy } from "@mui/icons-material";
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
  AttendanceCopyWeekResult,
  AttendanceShift,
} from "@/types/attendance";
import type { attendanceScheduledDayKindValues } from "@/types/api";
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
import { getDaySchedules, toTimeDayjs } from "@/utils/openingHours";
import { scheduledHours } from "@/utils/scheduledHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const ToolbarStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
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

const storeDate = (value: string | Date) =>
  dayjs(value).tz(STORE_TIMEZONE).format("YYYY-MM-DD");

type ShiftChange = Pick<
  AttendanceShift,
  "endsAt" | "paidBreak" | "startsAt"
> & { dayKind?: (typeof attendanceScheduledDayKindValues)[number] };

interface CalendarProps {
  canCreate: boolean;
  canReadLeaves: boolean;
  canUpdate: boolean;
  dayKinds: AttendanceCalendarDayKinds;
  employees: AttendanceEmployee[];
  leaves: AttendanceRequest[];
  organization: Organization;
  shifts: AttendanceShift[];
  date: string;
  view: AttendanceCalendarView;
}

const Calendar = ({
  canCreate,
  canReadLeaves,
  canUpdate,
  date: initialDate,
  dayKinds: initialDayKinds,
  employees,
  leaves: initialLeaves,
  organization: { openingHours = "", slug: organizationSlug },
  shifts: initialShifts,
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
          readOnly: !canUpdate || shift.state !== "scheduled",
          resource: shift.employeeId,
          start: shift.startsAt,
          title: shift.employeeName,
        })),
    ],
    [canUpdate, dayKinds, holidays, leaves, shifts, tAttendance],
  );

  const localeText = useMemo<EventCalendarProps<object, object>["localeText"]>(
    () => ({
      allDay: tAttendance("schedule.allDay"),
      amPm12h: tAttendance("schedule.preferences.amPm12h"),
      calendarContentAriaLabel: tAttendance("schedule.calendarContent"),
      closeSidePanel: tAttendance("schedule.closeSidePanel"),
      eventContextMenuAriaLabel: tAttendance("schedule.eventActions"),
      eventItemMultiDayLabel: (date) =>
        tAttendance("schedule.endsOn", { date }),
      hiddenEvents: (count) => tAttendance("schedule.moreEvents", { count }),
      hour24h: tAttendance("schedule.preferences.hour24h"),
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
      timeFormat: tAttendance("schedule.preferences.timeFormat"),
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

  const handleCopied = useCallback(
    ({ created, skipped }: AttendanceCopyWeekResult) => {
      mutate();

      enqueueSnackbar(
        tAttendance("copyWeek.result", {
          created: created.length,
          skipped: skipped.length,
        }),
        {
          action: (key) => (
            <Button
              color="inherit"
              onClick={async () => {
                closeSnackbar(key);

                try {
                  await Promise.all(
                    created.map(({ id }) =>
                      fetcher(
                        `${attendancePath(organizationSlug, "org", "shifts")}/${id}/cancel`,
                        { method: "PATCH" },
                      ),
                    ),
                  );
                } catch (error) {
                  enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
                    variant: "error",
                  });
                }

                mutate();
              }}
              size="small"
            >
              {tAttendance("schedule.undo")}
            </Button>
          ),
          variant: "success",
        },
      );
    },
    [mutate, organizationSlug, tAttendance],
  );

  const handleCopyWeek = useCallback(
    () =>
      setDialog({
        confirmText: tAttendance("copyWeek.confirm"),
        content: (
          <CopyWeekDialog
            from={range.from.format("YYYY-MM-DD")}
            onCopied={handleCopied}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-copy-week-form",
        open: true,
        title: tAttendance("schedule.copyWeek"),
      }),
    [handleCopied, organizationSlug, range, setDialog, tAttendance],
  );

  const handleViewEvents = useCallback(
    (shift: AttendanceShift) => {
      const cancellable = canUpdate && shift.state === "scheduled";

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

                enqueueSnackbar(
                  tAttendance("schedule.shiftCancelled", {
                    name: shift.employeeName,
                  }),
                  { variant: "success" },
                );
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
    [canUpdate, mutate, organizationSlug, setDialog, tAttendance],
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

  const saveShift = useCallback(
    (id: string, change: ShiftChange) =>
      mutate(
        async () => {
          await fetcher(
            `${attendancePath(organizationSlug, "org", "shifts")}/${id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(change),
            },
          );

          return undefined;
        },
        {
          optimisticData: (current = shifts) =>
            current.map((item) =>
              item.id === id
                ? { ...item, ...change, dayKind: item.dayKind }
                : item,
            ),
          populateCache: false,
          revalidate: true,
          rollbackOnError: true,
        },
      ),
    [mutate, organizationSlug, shifts],
  );

  const updateShift = useCallback(
    async (shift: AttendanceShift, change: ShiftChange) => {
      const original: ShiftChange = {
        endsAt: shift.endsAt,
        paidBreak: shift.paidBreak,
        startsAt: shift.startsAt,
        ...(change.dayKind && {
          dayKind: shift.dayKind === "holiday" ? "workday" : shift.dayKind,
        }),
      };

      try {
        await saveShift(shift.id, change);

        enqueueSnackbar(
          tAttendance("schedule.shiftUpdated", { name: shift.employeeName }),
          {
            action: (key) => (
              <Button
                color="inherit"
                onClick={async () => {
                  closeSnackbar(key);

                  try {
                    await saveShift(shift.id, original);
                  } catch (error) {
                    enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
                      variant: "error",
                    });
                  }
                }}
                size="small"
              >
                {tAttendance("schedule.undo")}
              </Button>
            ),
            variant: "success",
          },
        );
      } catch (error) {
        enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
          variant: "error",
        });
      }
    },
    [saveShift, tAttendance],
  );

  const handleEventsChange = useCallback(
    (value: SchedulerEvent[]) => {
      for (const event of value) {
        const shift = shifts.find(({ id }) => id === event.id);

        if (!shift || event.allDay) continue;

        const startsAt = dayjs(event.start);
        const endsAt = dayjs(event.end);
        const offset = startsAt.diff(shift.startsAt);

        if (!offset && endsAt.isSame(shift.endsAt)) continue;

        const change: ShiftChange = {
          endsAt: endsAt.toISOString(),
          paidBreak: shift.paidBreak,
          startsAt: startsAt.toISOString(),
        };
        const date = storeDate(change.startsAt);

        if (
          employees.find(({ id }) => id === shift.employeeId)
            ?.regularLeaveWeekday !== null ||
          date === storeDate(shift.startsAt)
        ) {
          updateShift(shift, change);
          continue;
        }

        const sameDayKind = shifts.find(
          (item) =>
            item.id !== shift.id &&
            item.employeeId === shift.employeeId &&
            item.status !== "cancelled" &&
            storeDate(item.startsAt) === date,
        )?.dayKind;

        if (sameDayKind) {
          updateShift(shift, {
            ...change,
            dayKind: sameDayKind === "holiday" ? "workday" : sameDayKind,
          });
          continue;
        }

        if (shift.dayKind === "workday" || shift.dayKind === "holiday") {
          updateShift(shift, { ...change, dayKind: "workday" });
          continue;
        }

        setDialog({
          confirmText: tAttendance("save"),
          content: (
            <DayKindDialog
              defaultValue={shift.dayKind}
              onSubmit={(dayKind) => updateShift(shift, { ...change, dayKind })}
            />
          ),
          formId: "attendance-shift-day-kind-form",
          open: true,
          title: tAttendance("schedule.moveShift"),
        });
      }
    },
    [employees, setDialog, shifts, tAttendance, updateShift],
  );

  const viewConfig = useMemo(() => {
    const openingHourValues = Array.from(
      { length: range.to.diff(range.from, "day") },
      (_, index) => getDaySchedules(openingHours, range.from.add(index, "day")),
    ).flatMap((schedules) =>
      schedules.flatMap(
        ({ startTime }) => toTimeDayjs(startTime)?.hour() ?? [],
      ),
    );
    const timeGrid = openingHourValues.length
      ? { initialScrollTime: Math.min(...openingHourValues) }
      : {};

    return { day: timeGrid, week: timeGrid };
  }, [openingHours, range]);

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
          {view === "week" && (
            <Button
              onClick={handleCopyWeek}
              size="small"
              startIcon={<ContentCopy />}
            >
              {tAttendance("schedule.copyWeek")}
            </Button>
          )}
        </ToolbarStack>
      )}
      <CalendarBox>
        <EventCalendar
          areEventsDraggable={canUpdate}
          areEventsResizable={canUpdate}
          defaultPreferences={{ weekStartsOn: 0 }}
          displayTimezone={STORE_TIMEZONE}
          eventCreation={canCreate}
          events={events}
          localeText={localeText}
          onEventEditingStart={handleEventEditingStart}
          onEventsChange={handleEventsChange}
          onViewChange={setView}
          onVisibleDateChange={(value) =>
            setDate(dayjs(value).tz(STORE_TIMEZONE).format("YYYY-MM-DD"))
          }
          preferencesMenuConfig={{
            toggleEmptyDaysInAgenda: false,
          }}
          resources={resources}
          view={view}
          viewConfig={viewConfig}
          views={[...ATTENDANCE_CALENDAR_VIEWS]}
          visibleDate={visibleDate}
        />
      </CalendarBox>
    </>
  );
};

export default Calendar;
