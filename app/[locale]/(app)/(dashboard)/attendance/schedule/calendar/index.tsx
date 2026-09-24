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

import { Add, ChevronLeft, ChevronRight, Close } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

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
} from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";
import { scheduledHours } from "@/utils/scheduledHours";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const ToolbarStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1),
}));

const SpacerBox = styled(Box)({
  flexGrow: 1,
});

const StyledPaper = styled(Paper)({
  overflowX: "auto",
});

const Grid = styled(Box)({
  display: "grid",
  gridTemplateColumns: `minmax(112px, max-content) repeat(${WEEK_DAYS}, minmax(112px, 1fr))`,
  minWidth: "max-content",
  width: "100%",
});

const Cell = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderInlineEnd: `1px solid ${theme.palette.divider}`,
}));

const HeadCell = styled(Cell, {
  shouldForwardProp: (prop) => prop !== "today",
})<{ today: boolean }>(({ theme, today }) => ({
  ...(today && { backgroundColor: theme.palette.action.hover }),
  padding: theme.spacing(1),
  textAlign: "center",
}));

const NameCell = styled(Cell)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  left: 0,
  padding: theme.spacing(1),
  position: "sticky",
  zIndex: 1,
}));

const RowBox = styled(Box)({
  display: "contents",
});

const DayCell = styled(Cell, {
  shouldForwardProp: (prop) => prop !== "today",
})<{ today: boolean }>(({ theme, today }) => ({
  ...(today && { backgroundColor: theme.palette.action.hover }),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  minHeight: theme.spacing(8),
  padding: theme.spacing(0.5),
}));

const ShiftCard = styled(Stack, {
  shouldForwardProp: (prop) => prop !== "muted",
})<{ muted: boolean }>(({ muted, theme }) => ({
  alignItems: "center",
  backgroundColor: muted
    ? theme.palette.action.selected
    : theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  color: muted
    ? theme.palette.text.primary
    : theme.palette.primary.contrastText,
  flexDirection: "row",
  gap: theme.spacing(0.5),
  justifyContent: "space-between",
  paddingInlineStart: theme.spacing(0.75),
}));

const ShiftButton = styled("button")({
  flexGrow: 1,
  background: "none",
  border: 0,
  color: "inherit",
  cursor: "pointer",
  font: "inherit",
  padding: 0,
  textAlign: "start",
});

const StyledIconButton = styled(IconButton)({
  alignSelf: "center",
});

const StyledTypography = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2),
}));

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

  const days = useMemo(
    () =>
      Array.from({ length: WEEK_DAYS }, (_, index) => start.add(index, "day")),
    [start],
  );

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

  const byEmployee = useMemo(() => {
    const grouped = new Map<string, AttendanceShift[]>();

    for (const shift of shifts) {
      if (shift.status === "cancelled") continue;

      for (const day of days) {
        if (
          dayjs(shift.startsAt).valueOf() >= day.add(1, "day").valueOf() ||
          dayjs(shift.endsAt).valueOf() <= day.valueOf()
        )
          continue;

        const key = `${shift.employeeId}:${day.format("YYYY-MM-DD")}`;
        grouped.set(key, [...(grouped.get(key) ?? []), shift]);
      }
    }

    return grouped;
  }, [days, shifts]);

  const hoursByEmployee = useMemo(() => {
    const totals = new Map<string, number>();
    const from = start.valueOf();
    const to = start.add(WEEK_DAYS, "day").valueOf();

    for (const shift of shifts) {
      totals.set(
        shift.employeeId,
        (totals.get(shift.employeeId) ?? 0) + scheduledHours(shift, from, to),
      );
    }

    return totals;
  }, [shifts, start]);

  const goToWeek = useCallback(
    (value: string) => updateQuery({ week: value }),
    [updateQuery],
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
    (shift: AttendanceShift) =>
      setDialog({
        content: <EventsDialogContent shift={shift} />,
        open: true,
        showConfirm: false,
        title: tAttendance("events"),
      }),
    [setDialog, tAttendance],
  );

  const handleCancel = useCallback(
    ({ id }: AttendanceShift) =>
      setDialog({
        contentText: tAttendance("confirm"),
        onConfirm: async () => {
          try {
            await fetcher(
              `${attendancePath(organizationSlug, "org", "shifts")}/${id}/cancel`,
              { method: "PATCH" },
            );

            enqueueSnackbar(tAttendance("success"), { variant: "success" });
            mutate();
          } catch (error) {
            enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
              variant: "error",
            });
          }
        },
        open: true,
        title: tAttendance("cancelShift"),
      }),
    [mutate, organizationSlug, setDialog, tAttendance],
  );

  const time = useCallback(
    (value: string | number) =>
      format.dateTime(new Date(value), {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: STORE_TIMEZONE,
      }),
    [format],
  );

  const today = dayjs().tz(STORE_TIMEZONE).format("YYYY-MM-DD");

  return (
    <>
      <ToolbarStack direction="row">
        <Tooltip title={tAttendance("schedule.previousWeek")}>
          <IconButton
            onClick={() =>
              goToWeek(start.subtract(WEEK_DAYS, "day").format("YYYY-MM-DD"))
            }
            size="small"
          >
            <ChevronLeft />
          </IconButton>
        </Tooltip>
        <Tooltip title={tAttendance("schedule.nextWeek")}>
          <IconButton
            onClick={() =>
              goToWeek(start.add(WEEK_DAYS, "day").format("YYYY-MM-DD"))
            }
            size="small"
          >
            <ChevronRight />
          </IconButton>
        </Tooltip>
        <Button onClick={() => goToWeek(today)} size="small">
          {tAttendance("schedule.thisWeek")}
        </Button>
        <Typography variant="subtitle1">
          {format.dateTimeRange(
            start.toDate(),
            start.add(WEEK_DAYS - 1, "day").toDate(),
            { day: "numeric", month: "short", timeZone: STORE_TIMEZONE },
          )}
        </Typography>
        <SpacerBox />
        {canCreate && (
          <Button
            onClick={() => handleCreate()}
            size="small"
            startIcon={<Add />}
            variant="contained"
          >
            {tAttendance("shifts.actions.create")}
          </Button>
        )}
        {canCreate && templates.length > 0 && (
          <Button onClick={handleApplyTemplate} size="small">
            {tAttendance("schedule.applyTemplate")}
          </Button>
        )}
      </ToolbarStack>
      <StyledPaper variant="outlined">
        <Grid>
          <NameCell />
          {days.map((day) => (
            <HeadCell
              key={day.format("YYYY-MM-DD")}
              today={day.format("YYYY-MM-DD") === today}
            >
              <Typography variant="body2">
                {format.dateTime(day.toDate(), {
                  timeZone: STORE_TIMEZONE,
                  weekday: "short",
                })}
              </Typography>
              <Typography color="textSecondary" variant="caption">
                {format.dateTime(day.toDate(), {
                  day: "numeric",
                  month: "numeric",
                  timeZone: STORE_TIMEZONE,
                })}
              </Typography>
            </HeadCell>
          ))}
          {employees.map(({ id: employeeId, name }) => (
            <RowBox key={employeeId}>
              <NameCell>
                <Typography variant="body2">{name}</Typography>
                <Typography color="textSecondary" variant="caption">
                  {tAttendance("schedule.scheduledHours", {
                    hours: format.number(hoursByEmployee.get(employeeId) ?? 0, {
                      maximumFractionDigits: 2,
                    }),
                  })}
                </Typography>
              </NameCell>
              {days.map((day) => {
                const date = day.format("YYYY-MM-DD");
                const cellShifts =
                  byEmployee.get(`${employeeId}:${date}`) ?? [];

                return (
                  <DayCell key={date} today={date === today}>
                    {cellShifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        muted={shift.dayKind !== "workday"}
                      >
                        <ShiftButton
                          onClick={() => handleViewEvents(shift)}
                          type="button"
                        >
                          <Typography noWrap variant="caption">
                            {time(
                              Math.max(
                                dayjs(shift.startsAt).valueOf(),
                                day.valueOf(),
                              ),
                            )}
                            {"–"}
                            {time(
                              Math.min(
                                dayjs(shift.endsAt).valueOf(),
                                day.add(1, "day").valueOf(),
                              ),
                            )}
                          </Typography>
                        </ShiftButton>
                        {canCancel && shift.state === "scheduled" && (
                          <Tooltip title={tAttendance("cancelShift")}>
                            <IconButton
                              color="inherit"
                              onClick={() => handleCancel(shift)}
                              size="small"
                            >
                              <Close fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </ShiftCard>
                    ))}
                    {canCreate && (
                      <Tooltip title={tAttendance("shifts.actions.create")}>
                        <StyledIconButton
                          onClick={() => handleCreate(employeeId, date)}
                          size="small"
                        >
                          <Add fontSize="inherit" />
                        </StyledIconButton>
                      </Tooltip>
                    )}
                  </DayCell>
                );
              })}
            </RowBox>
          ))}
        </Grid>
        {!employees.length && (
          <StyledTypography color="textSecondary" variant="body2">
            {tAttendance("empty")}
          </StyledTypography>
        )}
      </StyledPaper>
    </>
  );
};

export default Calendar;
