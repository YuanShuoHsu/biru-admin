"use client";

import type { Dayjs } from "dayjs";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Add, DeleteOutline } from "@mui/icons-material";
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  type FormControlProps,
  type FormLabelProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  multiSectionDigitalClockSectionClasses,
  type TimeView,
} from "@mui/x-date-pickers";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import {
  DAYS,
  formatDays,
  formatOpeningHoursForDisplay,
  getConflictingSchedules,
  getSchedulesOutsideOpeningHours,
  hasNextDayTail,
  isBoundWithinOpeningHours,
  parseOpeningHours,
  serializeOpeningHours,
  toTimeDayjs,
  type Day,
  type Schedule,
} from "@/utils/openingHours";

const TIME_STEPS = { hours: 1, minutes: 5 };

const CLOCK_SECTION = `.${multiSectionDigitalClockSectionClasses.root}`;

const pad = (unit: number) => String(unit).padStart(2, "0");

const range = (limit: number, step: number) =>
  Array.from({ length: Math.ceil(limit / step) }, (_, index) => index * step);

const keepUnlessAll = (hidden: number[], units: number[]) =>
  hidden.length === units.length ? [] : hidden;

const isBoundOutsideOpeningHours = (
  openingHours: string,
  { days, startTime }: Pick<Schedule, "days" | "startTime" | "endTime">,
  bound: "start" | "end",
  time: string,
) =>
  !isBoundWithinOpeningHours(
    openingHours,
    bound === "start"
      ? { days, startTime: time, endTime: "" }
      : { days, startTime, endTime: time },
    bound,
  );

const disableTimeOutsideOpeningHours =
  (
    openingHours: string,
    schedule: Pick<Schedule, "days" | "startTime" | "endTime">,
    bound: "start" | "end",
  ) =>
  (time: Dayjs, view: TimeView) => {
    const isOutside = (at: Dayjs) =>
      isBoundOutsideOpeningHours(
        openingHours,
        schedule,
        bound,
        at.format("HH:mm"),
      );

    return view === "hours"
      ? range(60, TIME_STEPS.minutes).every((minute) =>
          isOutside(time.minute(minute)),
        )
      : isOutside(time);
  };

const hiddenOptionsSx = (
  openingHours: string,
  {
    days,
    startTime,
    endTime,
  }: Pick<Schedule, "days" | "startTime" | "endTime">,
  bound: "start" | "end",
) => {
  const own = bound === "start" ? startTime : endTime;
  const isOutside = (time: string) =>
    isBoundOutsideOpeningHours(
      openingHours,
      { days, startTime: "", endTime: "" },
      bound,
      time,
    );

  const [ownHour, ownMinute] = own
    ? own.split(":").map((unit) => pad(Number(unit)))
    : [];

  const hours = range(24, TIME_STEPS.hours);
  const minutes = range(60, TIME_STEPS.minutes);

  const hiddenHours = keepUnlessAll(
    hours.filter(
      (hour) =>
        pad(hour) !== ownHour &&
        minutes.every((minute) => isOutside(`${pad(hour)}:${pad(minute)}`)),
    ),
    hours,
  );

  const hiddenMinutes = keepUnlessAll(
    own
      ? minutes.filter(
          (minute) =>
            pad(minute) !== ownMinute && isOutside(`${ownHour}:${pad(minute)}`),
        )
      : [],
    minutes,
  );

  const selector = (section: number, step: number, units: number[]) =>
    units.map(
      (unit) =>
        `& ${CLOCK_SECTION}:nth-of-type(${section}) > li:nth-child(${unit / step + 1})`,
    );

  const hidden = [
    ...selector(1, TIME_STEPS.hours, hiddenHours),
    ...selector(2, TIME_STEPS.minutes, hiddenMinutes),
  ];

  return hidden.length ? { [hidden.join(", ")]: { display: "none" } } : {};
};

const StyledToggleButtonGroup = styled(ToggleButtonGroup)({
  flexWrap: "wrap",
});

const StyledGrid = styled(Grid)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr auto",
  alignItems: "center",
  gap: theme.spacing(2),

  "@media (max-width: 400px)": {
    gridTemplateColumns: "1fr auto",
  },

  "@media (max-width: 320px)": {
    gridTemplateColumns: "1fr",
  },
}));

interface OpeningHoursFieldProps extends Omit<FormControlProps, "onChange"> {
  label: FormLabelProps["children"];
  onChange: (value: string) => void;
  openingHours?: string | null;
  value?: string;
}

const OpeningHoursField = ({
  error,
  label,
  onChange,
  openingHours,
  value = "",
  ...props
}: OpeningHoursFieldProps) => {
  const tCommon = useTranslations("common");
  const tOrganizations = useTranslations("organizations");

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const parsed = parseOpeningHours(value);

    return parsed.length > 0
      ? parsed
      : [{ id: crypto.randomUUID(), days: [], startTime: "", endTime: "" }];
  });

  const scheduleConflicts = getConflictingSchedules(schedules);
  const schedulesOutsideOpeningHours = getSchedulesOutsideOpeningHours(
    schedules,
    openingHours ?? "",
  );

  const displayConfig = {
    formatDay: (day: Day) => tCommon(`location.openingHours.${day}`),
    formatNextDayTime: (time: string) =>
      tCommon("location.openingHours.nextDayTime", { time }),
    allDayLabel: tCommon("location.openingHours.allDay"),
    rangeSeparator: tCommon("location.openingHours.rangeSeparator"),
    delimiter: tCommon("delimiter"),
  };

  const updateSchedule = (newSchedules: Schedule[]) => {
    setSchedules(newSchedules);
    onChange(serializeOpeningHours(newSchedules));
  };

  const handleScheduleAdd = () =>
    updateSchedule([
      ...schedules,
      { id: crypto.randomUUID(), days: [], startTime: "", endTime: "" },
    ]);

  const handleScheduleRemove = (id: string) =>
    updateSchedule(schedules.filter((schedule) => schedule.id !== id));

  const handleScheduleChange = (
    id: string,
    changes: Partial<Omit<Schedule, "id">>,
  ) =>
    updateSchedule(
      schedules.map((schedule) =>
        schedule.id === id ? { ...schedule, ...changes } : schedule,
      ),
    );

  return (
    <FormControl
      component="fieldset"
      error={error}
      variant="standard"
      {...props}
    >
      <FormLabel component="legend">{label}</FormLabel>
      {!!openingHours && (
        <FormHelperText sx={{ color: "text.secondary" }}>
          {tOrganizations("localBusiness.openingHours.reference", {
            value: formatOpeningHoursForDisplay(
              openingHours,
              displayConfig,
            ).join(tCommon("delimiter")),
          })}
        </FormHelperText>
      )}
      <Stack gap={2} mt={1}>
        {schedules.map(({ id, days, startTime, endTime }) => {
          const conflictingDays = scheduleConflicts.get(id);
          const hasConflict = !!conflictingDays;
          const outsideDays = schedulesOutsideOpeningHours.get(id);
          const hasMissingDays =
            error && days.length === 0 && (!!startTime || !!endTime);
          const clockSchedule = { days, startTime, endTime };
          const hasStartTimeError = error && days.length > 0 && !startTime;
          const hasEndTimeError = error && days.length > 0 && !endTime;

          return (
            <Stack key={id} gap={0.5}>
              <Grid container alignItems="start" spacing={2}>
                <Grid size={{ xs: 12, sm: "auto" }}>
                  <StyledToggleButtonGroup
                    onChange={(_, newDays: Day[]) =>
                      handleScheduleChange(id, { days: newDays })
                    }
                    size="small"
                    value={days}
                  >
                    {DAYS.map((day) => (
                      <ToggleButton
                        color={
                          conflictingDays?.has(day) || hasMissingDays
                            ? "error"
                            : outsideDays?.has(day)
                              ? "warning"
                              : "standard"
                        }
                        key={day}
                        value={day}
                      >
                        {tOrganizations(
                          `localBusiness.openingHours.days.${day}`,
                        )}
                      </ToggleButton>
                    ))}
                  </StyledToggleButtonGroup>
                  {hasMissingDays && (
                    <FormHelperText error>
                      {tOrganizations("localBusiness.openingHours.missingDays")}
                    </FormHelperText>
                  )}
                </Grid>
                <StyledGrid size={{ xs: 12, sm: "grow" }}>
                  <TimePicker
                    ampm={false}
                    format="HH:mm"
                    onChange={(time) =>
                      handleScheduleChange(id, {
                        startTime: time?.isValid() ? time.format("HH:mm") : "",
                      })
                    }
                    shouldDisableTime={disableTimeOutsideOpeningHours(
                      openingHours ?? "",
                      clockSchedule,
                      "start",
                    )}
                    slotProps={{
                      field: { clearable: true },
                      layout: {
                        sx: hiddenOptionsSx(
                          openingHours ?? "",
                          clockSchedule,
                          "start",
                        ),
                      },
                      textField: {
                        error: hasConflict || hasStartTimeError,
                        helperText: hasStartTimeError
                          ? tOrganizations(
                              "localBusiness.openingHours.missingStartTime",
                            )
                          : undefined,
                        size: "small",
                      },
                    }}
                    timeSteps={TIME_STEPS}
                    value={toTimeDayjs(startTime)}
                  />
                  <Typography textAlign="center" variant="body2">
                    {tOrganizations("localBusiness.openingHours.to")}
                  </Typography>
                  <TimePicker
                    ampm={false}
                    format="HH:mm"
                    onChange={(time) =>
                      handleScheduleChange(id, {
                        endTime: time?.isValid() ? time.format("HH:mm") : "",
                      })
                    }
                    shouldDisableTime={disableTimeOutsideOpeningHours(
                      openingHours ?? "",
                      clockSchedule,
                      "end",
                    )}
                    slotProps={{
                      field: { clearable: true },
                      layout: {
                        sx: hiddenOptionsSx(
                          openingHours ?? "",
                          clockSchedule,
                          "end",
                        ),
                      },
                      textField: {
                        error: hasConflict || hasEndTimeError,
                        helperText: hasEndTimeError
                          ? tOrganizations(
                              "localBusiness.openingHours.missingEndTime",
                            )
                          : hasNextDayTail({ startTime, endTime })
                            ? tOrganizations(
                                "localBusiness.openingHours.nextDay",
                              )
                            : undefined,
                        size: "small",
                      },
                    }}
                    timeSteps={TIME_STEPS}
                    value={toTimeDayjs(endTime)}
                  />
                  <IconButton
                    onClick={() => handleScheduleRemove(id)}
                    size="small"
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </StyledGrid>
              </Grid>
              {hasConflict && (
                <FormHelperText error>
                  {tOrganizations("localBusiness.openingHours.conflict", {
                    days: formatDays([...conflictingDays], displayConfig),
                  })}
                </FormHelperText>
              )}
              {!hasConflict && outsideDays && (
                <FormHelperText sx={{ color: "warning.main" }}>
                  {tOrganizations(
                    "localBusiness.openingHours.outsideOpeningHours",
                    { days: formatDays([...outsideDays], displayConfig) },
                  )}
                </FormHelperText>
              )}
            </Stack>
          );
        })}
        <Button
          onClick={handleScheduleAdd}
          startIcon={<Add />}
          variant="outlined"
        >
          {tOrganizations("localBusiness.openingHours.addSchedule")}
        </Button>
      </Stack>
    </FormControl>
  );
};

export default OpeningHoursField;
