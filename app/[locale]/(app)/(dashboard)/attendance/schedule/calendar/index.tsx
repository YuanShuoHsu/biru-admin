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
import ShiftDialog, { type ShiftChange } from "../../ShiftDialog";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { useCancelShift } from "@/hooks/useCancelShift";
import { useUpdateQuery } from "@/hooks/useUpdateQuery";

import { Add, ContentCopy } from "@mui/icons-material";
import { Box, Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  EventCalendar,
  eventCalendarClasses,
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
  AttendanceShiftType,
  AttendanceTeam,
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
import { getDaySchedules, toTimeDayjs } from "@/utils/openingHours";
import { scheduledHours } from "@/utils/scheduledHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const ToolbarStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const CalendarBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "breakPatterns",
})<{ breakPatterns: [number, number][][] }>(({ breakPatterns, theme }) => {
  const breakColor = `rgba(${theme.vars.palette.background.paperChannel} / 0.6)`;

  return {
    height: 720,
    ...Object.fromEntries(
      breakPatterns.map((ranges, index) => [
        `& .${eventCalendarClasses.timeGridEvent}.${breakClassName(index)}`,
        {
          backgroundImage: `linear-gradient(to bottom, ${ranges
            .flatMap(([from, to]) => [
              `transparent ${from}%`,
              `${breakColor} ${from}%`,
              `${breakColor} ${to}%`,
              `transparent ${to}%`,
            ])
            .join(", ")})`,
        },
      ]),
    ),
  };
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

const breakClassName = (index: number) => `attendance-shift-breaks-${index}`;

const storeDate = (value: string | Date) =>
  dayjs(value).tz(STORE_TIMEZONE).format("YYYY-MM-DD");

interface CalendarProps {
  canCreate: boolean;
  canReadLeaves: boolean;
  canUpdate: boolean;
  dayKinds: AttendanceCalendarDayKinds;
  employees: AttendanceEmployee[];
  leaves: AttendanceRequest[];
  organization: Organization;
  shifts: AttendanceShift[];
  shiftTypes: AttendanceShiftType[];
  teams: AttendanceTeam[];
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
  shiftTypes,
  teams,
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

  const { data: shifts = initialShifts, mutate: mutateShifts } = useSWR(
    attendanceCalendarPath(organizationSlug, "shifts", from, to),
    (url: string) => fetcher<AttendanceShift[]>(url),
    { fallbackData: initialShifts },
  );

  const {
    data: { dayKinds, holidays, pendingSubstitutes } = initialDayKinds,
    mutate: mutateDayKinds,
  } = useSWR(
    attendanceCalendarPath(organizationSlug, "day-kinds", from, to),
    (url: string) => fetcher<AttendanceCalendarDayKinds>(url),
    { fallbackData: initialDayKinds },
  );

  const mutate = useCallback(() => {
    mutateDayKinds();
    mutateShifts();
  }, [mutateDayKinds, mutateShifts]);

  const { data: leaves = initialLeaves } = useSWR(
    canReadLeaves
      ? attendanceCalendarPath(organizationSlug, "leaves", from, to)
      : null,
    (url: string) => fetcher<AttendanceRequest[]>(url),
    { fallbackData: initialLeaves },
  );

  const employeeLabels = useMemo(() => {
    const duplicateNames = new Set(
      employees
        .map(({ name }) => name)
        .filter((name, index, names) => names.indexOf(name) !== index),
    );

    return new Map(
      employees.map(({ email, id, name }) => [
        id,
        duplicateNames.has(name)
          ? tAttendance("schedule.employeeWithEmail", { email, name })
          : name,
      ]),
    );
  }, [employees, tAttendance]);

  const employeeLabel = useCallback(
    (employeeId: string, name: string) =>
      employeeLabels.get(employeeId) ?? name,
    [employeeLabels],
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
          title: `${employeeLabel(id, name)} · ${tAttendance(
            "schedule.scheduledHours",
            {
              hours: format.number(hours, { maximumFractionDigits: 2 }),
            },
          )}`,
        };
      }),
    [employeeLabel, employees, format, range, shifts, tAttendance],
  );

  const breaks = useMemo(() => {
    const patterns = new Map<string, [number, number][]>();
    const classNames = new Map<string, string>();

    for (const shift of shifts) {
      if (!shift.breaks.length) continue;

      const start = dayjs(shift.startsAt);
      const duration = dayjs(shift.endsAt).diff(start);
      const ranges = shift.breaks.map(
        ({ endsAt, startsAt }) =>
          [
            (dayjs(startsAt).diff(start) / duration) * 100,
            (dayjs(endsAt).diff(start) / duration) * 100,
          ] satisfies [number, number],
      );
      const key = ranges.join();

      if (!patterns.has(key)) patterns.set(key, ranges);

      classNames.set(
        shift.id,
        breakClassName([...patterns.keys()].indexOf(key)),
      );
    }

    return { classNames, patterns: [...patterns.values()] };
  }, [shifts]);

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
            title: `${employeeLabel(employeeId, employeeName)} · ${holidayName ?? tAttendance(`dayKind.options.${dayKind}`)}`,
          };
        },
      ),
      ...pendingSubstitutes.map(
        ({ date, employeeId, employeeName, holidayName }) => {
          const day = dayjs.tz(date, STORE_TIMEZONE).toISOString();

          return {
            allDay: true,
            color: "grey" as const,
            end: day,
            id: `pending-substitute-${employeeId}-${date}`,
            readOnly: true,
            resource: employeeId,
            start: day,
            title: tAttendance("schedule.pendingSubstitute", {
              holiday: holidayName,
              name: employeeLabel(employeeId, employeeName),
            }),
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
        title: `${employeeLabel(leave.employeeId, leave.employeeName)} · ${getStatutoryLeaveName(
          tAttendance,
          {
            name: leave.leaveTypeName ?? "",
            statutoryKind: leave.leaveTypeStatutoryKind ?? "custom",
          },
        )}`,
      })),
      ...shifts
        .filter(({ status }) => status !== "cancelled")
        .map((shift) => ({
          ...(shift.dayKind !== "workday" && { color: "grey" as const }),
          className: breaks.classNames.get(shift.id),
          end: shift.endsAt,
          id: shift.id,
          readOnly: !canUpdate || shift.state !== "scheduled",
          resource: shift.employeeId,
          start: shift.startsAt,
          title: shift.teamName
            ? `${employeeLabel(shift.employeeId, shift.employeeName)} · ${shift.teamName}`
            : employeeLabel(shift.employeeId, shift.employeeName),
        })),
    ],
    [
      breaks,
      canUpdate,
      dayKinds,
      employeeLabel,
      holidays,
      leaves,
      pendingSubstitutes,
      shifts,
      tAttendance,
    ],
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
            recentShifts={shifts}
            shiftTypes={shiftTypes}
            teams={teams}
          />
        ),
        formId: "attendance-shift-form",
        open: true,
        title: tAttendance("shifts.actions.create"),
      }),
    [
      employees,
      mutate,
      openingHours,
      organizationSlug,
      setDialog,
      shiftTypes,
      shifts,
      tAttendance,
      teams,
    ],
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
            employeeLabel={employeeLabel}
            from={range.from.format("YYYY-MM-DD")}
            onCopied={handleCopied}
            organizationSlug={organizationSlug}
          />
        ),
        formId: "attendance-copy-week-form",
        open: true,
        title: tAttendance("schedule.copyWeek"),
      }),
    [
      employeeLabel,
      handleCopied,
      organizationSlug,
      range,
      setDialog,
      tAttendance,
    ],
  );

  const saveShift = useCallback(
    async (id: string, change: ShiftChange) => {
      await mutateShifts(
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
                ? {
                    ...item,
                    ...change,
                    dayKind: item.dayKind,
                    employeeName:
                      employees.find(({ id }) => id === change.employeeId)
                        ?.name ?? item.employeeName,
                    ...(change.teamId !== undefined && {
                      teamName:
                        teams.find(({ id }) => id === change.teamId)?.name ??
                        null,
                    }),
                  }
                : item,
            ),
          populateCache: false,
          revalidate: true,
          rollbackOnError: true,
        },
      );

      mutateDayKinds();
    },
    [employees, mutateDayKinds, mutateShifts, organizationSlug, shifts, teams],
  );

  const updateShift = useCallback(
    async (shift: AttendanceShift, change: ShiftChange) => {
      const original: ShiftChange = {
        employeeId: shift.employeeId,
        endsAt: shift.endsAt,
        startsAt: shift.startsAt,
        teamId: shift.teamId ?? null,
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

        return true;
      } catch (error) {
        enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
          variant: "error",
        });

        return false;
      }
    },
    [saveShift, tAttendance],
  );

  const cancelShift = useCancelShift(organizationSlug, mutate);

  const handleOpenShift = useCallback(
    (shift: AttendanceShift) => {
      if (canUpdate && shift.state === "scheduled") {
        setDialog({
          confirmText: tAttendance("save"),
          content: (
            <ShiftDialog
              employees={employees}
              mutate={mutate}
              onCancelShift={cancelShift}
              onUpdateShift={updateShift}
              openingHours={openingHours}
              organizationSlug={organizationSlug}
              recentShifts={shifts}
              shift={shift}
              shiftTypes={shiftTypes}
              teams={teams}
            />
          ),
          formId: "attendance-shift-form",
          open: true,
          title: tAttendance("shifts.actions.edit"),
        });
        return;
      }

      setDialog({
        content: <EventsDialogContent shift={shift} />,
        open: true,
        showConfirm: false,
        title: tAttendance("events"),
      });
    },
    [
      canUpdate,
      cancelShift,
      employees,
      mutate,
      openingHours,
      organizationSlug,
      setDialog,
      shiftTypes,
      shifts,
      tAttendance,
      teams,
      updateShift,
    ],
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

      if (shift) handleOpenShift(shift);
    },
    [handleCreate, handleOpenShift, shifts],
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
          employeeId: shift.employeeId,
          endsAt: endsAt.toISOString(),
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
              onSubmit={async (dayKind) => {
                await updateShift(shift, { ...change, dayKind });
              }}
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
      <CalendarBox breakPatterns={breaks.patterns}>
        <EventCalendar
          areEventsDraggable={canUpdate}
          areEventsResizable={canUpdate}
          defaultPreferences={{ ampm: false, weekStartsOn: 0 }}
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
