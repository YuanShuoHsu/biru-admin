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

interface TimeSlot {
  days: Day[];
  startTime: string;
  endTime: string;
}

const parseDays = (daysPart: string): Day[] => {
  const isDayCode = (code: string): code is Day =>
    (DAYS as readonly string[]).includes(code);

  if (daysPart.includes(",")) return daysPart.split(",").filter(isDayCode);

  const parts = daysPart.split("-");
  if (parts.length === 2 && isDayCode(parts[0]) && isDayCode(parts[1])) {
    const startIdx = DAYS.indexOf(parts[0]);
    const endIdx = DAYS.indexOf(parts[1]);

    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx)
      return [...DAYS].slice(startIdx, endIdx + 1);
  }

  if (isDayCode(daysPart)) return [daysPart];

  return [];
};

const parseOpeningHours = (value: string): TimeSlot[] => {
  if (!value?.trim()) return [];
  return value
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const trimmed = line.trim();
      const spaceIdx = trimmed.indexOf(" ");
      if (spaceIdx === -1)
        return { days: parseDays(trimmed), startTime: "", endTime: "" };

      const daysPart = trimmed.slice(0, spaceIdx);
      const timePart = trimmed.slice(spaceIdx + 1);
      const dashIdx = timePart.indexOf("-");
      const startTime = dashIdx !== -1 ? timePart.slice(0, dashIdx) : timePart;
      const endTime = dashIdx !== -1 ? timePart.slice(dashIdx + 1) : "";

      return { days: parseDays(daysPart), startTime, endTime };
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

const serializeOpeningHours = (schedules: TimeSlot[]): string =>
  schedules
    .filter(({ days }) => days.length > 0)
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

const getConflictingSchedules = (schedules: TimeSlot[]): Set<number> => {
  const conflicting = new Set<number>();
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

      const hasCommonDay = scheduleA.days.some((day) =>
        scheduleB.days.includes(day),
      );
      if (!hasCommonDay) continue;

      const aStart = toMinutes(scheduleA.startTime);
      const aEnd = toMinutes(scheduleA.endTime);
      const bStart = toMinutes(scheduleB.startTime);
      const bEnd = toMinutes(scheduleB.endTime);

      if (aStart < bEnd && bStart < aEnd) {
        conflicting.add(outerIdx);
        conflicting.add(innerIdx);
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

  const [schedules, setSchedules] = useState<TimeSlot[]>(() => {
    const parsed = parseOpeningHours(value);

    return parsed.length > 0
      ? parsed
      : [{ days: [], startTime: "", endTime: "" }];
  });

  const conflicting = getConflictingSchedules(schedules);

  const updateSchedules = (newSchedules: TimeSlot[]) => {
    setSchedules(newSchedules);
    onChange(serializeOpeningHours(newSchedules));
  };

  const addSchedule = () =>
    updateSchedules([...schedules, { days: [], startTime: "", endTime: "" }]);

  const removeSchedule = (index: number) =>
    updateSchedules(
      schedules.filter((_, scheduleIndex) => scheduleIndex !== index),
    );

  const updateScheduleDays = (index: number, days: Day[]) =>
    updateSchedules(
      schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, days } : schedule,
      ),
    );

  const updateScheduleTime = (
    index: number,
    field: "startTime" | "endTime",
    value: Dayjs | null,
  ) => {
    const time = value?.isValid() ? value.format("HH:mm") : "";
    updateSchedules(
      schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, [field]: time } : schedule,
      ),
    );
  };

  const createShouldDisableTime =
    (scheduleIndex: number, field: "startTime" | "endTime") =>
    (value: Dayjs, view: TimeView) => {
      const { days, startTime, endTime } = schedules[scheduleIndex];
      if (days.length === 0) return false;

      const valueMinutes = value.hour() * 60 + value.minute();

      return schedules.some(
        (
          { days: otherDays, startTime: otherStartTime, endTime: otherEndTime },
          otherIndex,
        ) => {
          if (otherIndex === scheduleIndex || !otherStartTime || !otherEndTime)
            return false;
          if (!otherDays.some((day) => days.includes(day))) return false;
          const otherStart = toMinutes(otherStartTime);
          const otherEnd = toMinutes(otherEndTime);

          if (field === "endTime" && startTime) {
            const currentStart = toMinutes(startTime);

            return currentStart < otherEnd && valueMinutes > otherStart;
          }

          if (field === "startTime" && endTime) {
            const currentEnd = toMinutes(endTime);

            if (view === "hours")
              return currentEnd > otherStart && valueMinutes + 59 < otherEnd;

            return currentEnd > otherStart && valueMinutes < otherEnd;
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
      {schedules.map(({ days, endTime, startTime }, index) => {
        const hasConflict = conflicting.has(index);

        return (
          <Stack key={index} gap={0.5}>
            <Grid alignItems="start" container spacing={2}>
              <Grid size={{ xs: 12, sm: "auto" }}>
                <StyledToggleButtonGroup
                  onChange={(_, newDays: Day[]) =>
                    updateScheduleDays(index, newDays)
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
                  maxTime={
                    toTimeDayjs(endTime)?.subtract(1, "minute") || undefined
                  }
                  onChange={(time) =>
                    updateScheduleTime(index, "startTime", time)
                  }
                  shouldDisableTime={createShouldDisableTime(
                    index,
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
                  minTime={
                    toTimeDayjs(startTime)?.add(1, "minute") || undefined
                  }
                  onChange={(time) =>
                    updateScheduleTime(index, "endTime", time)
                  }
                  shouldDisableTime={createShouldDisableTime(index, "endTime")}
                  slotProps={{
                    textField: { error: hasConflict, size: "small" },
                  }}
                  value={toTimeDayjs(endTime)}
                />
                <IconButton onClick={() => removeSchedule(index)} size="small">
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
      <Button onClick={addSchedule} startIcon={<Add />} variant="outlined">
        {tOrganizations("localBusiness.openingHours.addSchedule")}
      </Button>
      {helperText && (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      )}
    </Stack>
  );
};

export default OpeningHoursField;
