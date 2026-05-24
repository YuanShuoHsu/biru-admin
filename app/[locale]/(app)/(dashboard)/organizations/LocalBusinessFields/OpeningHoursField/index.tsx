"use client";

import dayjs, { type Dayjs } from "dayjs";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Add, DeleteOutline } from "@mui/icons-material";
import {
  Button,
  FormHelperText,
  Grid,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import type { TimeView } from "@mui/x-date-pickers";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

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

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Day = (typeof DAYS)[number];

const DAYS_SET = new Set<string>(DAYS);
const isDayCode = (code: string): code is Day => DAYS_SET.has(code);

const parseDays = (daysPart: string): Day[] => {
  if (daysPart.includes(",")) return daysPart.split(",").filter(isDayCode);

  const parts = daysPart.split("-");
  if (parts.length === 2 && isDayCode(parts[0]) && isDayCode(parts[1])) {
    const startIdx = DAYS.indexOf(parts[0]);
    const endIdx = DAYS.indexOf(parts[1]);

    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx)
      return Array.from(DAYS).slice(startIdx, endIdx + 1);
  }

  if (isDayCode(daysPart)) return [daysPart];

  return [];
};

interface Schedule {
  id: string;
  days: Day[];
  startTime: string;
  endTime: string;
}

const parseOpeningHours = (value: string): Schedule[] => {
  if (!value?.trim()) return [];

  return value
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const trimmed = line.trim();
      const spaceIdx = trimmed.indexOf(" ");
      if (spaceIdx === -1)
        return {
          id: crypto.randomUUID(),
          days: parseDays(trimmed),
          startTime: "",
          endTime: "",
        };

      const daysPart = trimmed.slice(0, spaceIdx);
      const timePart = trimmed.slice(spaceIdx + 1);
      const dashIdx = timePart.indexOf("-");
      const startTime = dashIdx !== -1 ? timePart.slice(0, dashIdx) : timePart;
      const endTime = dashIdx !== -1 ? timePart.slice(dashIdx + 1) : "";

      return {
        id: crypto.randomUUID(),
        days: parseDays(daysPart),
        startTime,
        endTime,
      };
    })
    .filter((schedule) => schedule.days.length > 0);
};

const serializeDays = (days: Day[]): string => {
  const indices = days
    .map((day) => DAYS.indexOf(day))
    .sort((indexA, indexB) => indexA - indexB);
  if (indices.length === 0) return "";
  if (indices.length === 1) return DAYS[indices[0]];

  const isConsecutive = indices.every(
    (dayIndex, position) =>
      position === 0 || dayIndex === indices[position - 1] + 1,
  );
  if (isConsecutive)
    return `${DAYS[indices[0]]}-${DAYS[indices[indices.length - 1]]}`;

  return indices.map((dayIndex) => DAYS[dayIndex]).join(",");
};

const mergeSchedulesByTime = (
  schedules: Schedule[],
): Pick<Schedule, "days" | "startTime" | "endTime">[] => {
  const map = new Map<string, Set<Day>>();

  for (const { days, startTime, endTime } of schedules) {
    if (days.length === 0) continue;

    const key = `${startTime}|${endTime}`;
    const existing = map.get(key) ?? new Set<Day>();
    days.forEach((day) => existing.add(day));
    map.set(key, existing);
  }

  return Array.from(map.entries()).map(([key, daysSet]) => {
    const [startTime, endTime] = key.split("|");

    return { days: DAYS.filter((day) => daysSet.has(day)), startTime, endTime };
  });
};

const serializeOpeningHours = (schedules: Schedule[]): string =>
  mergeSchedulesByTime(schedules)
    .map(({ days, startTime, endTime }) => {
      const dayStr = serializeDays(days);
      if (startTime && endTime) return `${dayStr} ${startTime}-${endTime}`;

      return dayStr;
    })
    .join("\n");

const toTimeDayjs = (time: string): Dayjs | null =>
  time ? dayjs(`2000-01-01T${time}`) : null;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const getConflictingSchedules = (schedules: Schedule[]): Set<string> => {
  const conflicting = new Set<string>();

  for (let outerIdx = 0; outerIdx < schedules.length; outerIdx++) {
    for (let innerIdx = outerIdx + 1; innerIdx < schedules.length; innerIdx++) {
      const scheduleA = schedules[outerIdx];
      const scheduleB = schedules[innerIdx];
      if (
        !scheduleA.startTime ||
        !scheduleA.endTime ||
        !scheduleB.startTime ||
        !scheduleB.endTime
      )
        continue;

      if (!scheduleA.days.some((day) => scheduleB.days.includes(day))) continue;

      const aStart = toMinutes(scheduleA.startTime);
      const aEnd = toMinutes(scheduleA.endTime);
      const bStart = toMinutes(scheduleB.startTime);
      const bEnd = toMinutes(scheduleB.endTime);

      if (aStart < bEnd && bStart < aEnd) {
        conflicting.add(scheduleA.id);
        conflicting.add(scheduleB.id);
      }
    }
  }

  return conflicting;
};

interface OpeningHoursFieldProps {
  error?: boolean;
  helperText?: string;
  onChange: (value: string) => void;
  value?: string;
}

const OpeningHoursField = ({
  error,
  helperText,
  onChange,
  value = "",
}: OpeningHoursFieldProps) => {
  const tOrganizations = useTranslations("organizations");

  const [schedules, setSchedules] = useState<Schedule[]>(() => {
    const parsed = parseOpeningHours(value);

    return parsed.length > 0
      ? parsed
      : [{ id: crypto.randomUUID(), days: [], startTime: "", endTime: "" }];
  });

  const conflicting = getConflictingSchedules(schedules);

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

  const createShouldDisableTime =
    (
      { id, days, startTime, endTime }: Schedule,
      field: "startTime" | "endTime",
    ) =>
    (value: Dayjs, view: TimeView) => {
      if (days.length === 0) return false;

      const valueMinutes = value.hour() * 60 + value.minute();

      return schedules.some(
        ({
          id: otherId,
          days: otherDays,
          startTime: otherStartTime,
          endTime: otherEndTime,
        }) => {
          if (otherId === id || !otherStartTime || !otherEndTime) return false;
          if (!otherDays.some((day) => days.includes(day))) return false;

          const otherStart = toMinutes(otherStartTime);
          const otherEnd = toMinutes(otherEndTime);

          if (field === "endTime" && startTime) {
            const start = toMinutes(startTime);

            return start < otherEnd && valueMinutes > otherStart;
          }

          if (field === "startTime" && endTime) {
            const end = toMinutes(endTime);

            if (view === "hours")
              return end > otherStart && valueMinutes + 59 < otherEnd;

            return end > otherStart && valueMinutes < otherEnd;
          }

          if (view === "hours")
            return valueMinutes > otherStart && valueMinutes + 59 < otherEnd;

          return field === "startTime"
            ? valueMinutes >= otherStart && valueMinutes < otherEnd
            : valueMinutes > otherStart && valueMinutes <= otherEnd;
        },
      );
    };

  return (
    <Stack width="100%" gap={2}>
      <Typography color={error ? "error" : "text.secondary"} variant="body2">
        {tOrganizations("localBusiness.openingHours.label")}
      </Typography>
      {schedules.map((schedule) => {
        const { id, days, startTime, endTime } = schedule;
        const hasConflict = conflicting.has(id);

        return (
          <Stack key={id} gap={0.5}>
            <Grid alignItems="start" container spacing={2}>
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
                      color={hasConflict ? "error" : "standard"}
                      key={day}
                      value={day}
                    >
                      {tOrganizations(`localBusiness.openingHours.days.${day}`)}
                    </ToggleButton>
                  ))}
                </StyledToggleButtonGroup>
              </Grid>
              <StyledGrid size={{ xs: 12, sm: "grow" }}>
                <TimePicker
                  format="HH:mm"
                  maxTime={toTimeDayjs(endTime)?.subtract(1, "minute")}
                  onChange={(time) =>
                    handleScheduleChange(id, {
                      startTime: time?.isValid() ? time.format("HH:mm") : "",
                    })
                  }
                  shouldDisableTime={createShouldDisableTime(
                    schedule,
                    "startTime",
                  )}
                  slotProps={{
                    textField: { error: hasConflict, size: "small" },
                  }}
                  value={toTimeDayjs(startTime)}
                />
                <Typography textAlign="center" variant="body2">
                  {tOrganizations("localBusiness.openingHours.to")}
                </Typography>
                <TimePicker
                  format="HH:mm"
                  minTime={toTimeDayjs(startTime)?.add(1, "minute")}
                  onChange={(time) =>
                    handleScheduleChange(id, {
                      endTime: time?.isValid() ? time.format("HH:mm") : "",
                    })
                  }
                  shouldDisableTime={createShouldDisableTime(
                    schedule,
                    "endTime",
                  )}
                  slotProps={{
                    textField: { error: hasConflict, size: "small" },
                  }}
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
                {tOrganizations("localBusiness.openingHours.conflict")}
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
      {helperText && (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      )}
    </Stack>
  );
};

export default OpeningHoursField;
