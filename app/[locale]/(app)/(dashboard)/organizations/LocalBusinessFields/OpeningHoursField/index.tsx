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
  const isDayCode = (s: string): s is Day =>
    (DAYS as readonly string[]).includes(s);

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
    .filter((slot) => slot.days.length > 0);
};

const serializeDays = (days: Day[]): string => {
  const indices = days.map((d) => DAYS.indexOf(d)).sort((a, b) => a - b);
  if (indices.length === 0) return "";
  if (indices.length === 1) return DAYS[indices[0]];

  const isConsecutive = indices.every(
    (idx, i) => i === 0 || idx === indices[i - 1] + 1,
  );
  if (isConsecutive)
    return `${DAYS[indices[0]]}-${DAYS[indices[indices.length - 1]]}`;

  return indices.map((i) => DAYS[i]).join(",");
};

const serializeOpeningHours = (schedules: TimeSlot[]): string =>
  schedules
    .filter((slot) => slot.days.length > 0)
    .map((slot) => {
      const dayStr = serializeDays(slot.days);
      if (slot.startTime && slot.endTime)
        return `${dayStr} ${slot.startTime}-${slot.endTime}`;

      return dayStr;
    })
    .join("\n");

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);

  return h * 60 + m;
};

const getConflictingSchedules = (schedules: TimeSlot[]): Set<number> => {
  const conflicting = new Set<number>();
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];
      if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue;

      const hasCommonDay = a.days.some((d) => b.days.includes(d));
      if (!hasCommonDay) continue;

      const aStart = toMinutes(a.startTime);
      const aEnd = toMinutes(a.endTime);
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);

      if (aStart < bEnd && bStart < aEnd) {
        conflicting.add(i);
        conflicting.add(j);
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
    updateSchedules(schedules.filter((_, i) => i !== index));

  const updateScheduleDays = (index: number, days: Day[]) =>
    updateSchedules(
      schedules.map((slot, i) => (i === index ? { ...slot, days } : slot)),
    );

  const updateScheduleTime = (
    index: number,
    field: "startTime" | "endTime",
    value: Dayjs | null,
  ) => {
    const time = value?.isValid() ? value.format("HH:mm") : "";
    updateSchedules(
      schedules.map((slot, i) =>
        i === index ? { ...slot, [field]: time } : slot,
      ),
    );
  };

  const toTimeValue = (time: string): Dayjs | null =>
    time ? dayjs(`2000-01-01T${time}`) : null;

  const makeShouldDisableTime =
    (scheduleIndex: number, field: "startTime" | "endTime") =>
    (value: Dayjs, view: TimeView) => {
      if (view === "seconds") return false;

      const currentDays = schedules[scheduleIndex].days;
      if (currentDays.length === 0) return false;

      const currentSlot = schedules[scheduleIndex];
      const valueMinutes = value.hour() * 60 + value.minute();

      return schedules.some((s, i) => {
        if (i === scheduleIndex || !s.startTime || !s.endTime) return false;
        if (!s.days.some((d) => currentDays.includes(d))) return false;
        const sStart = toMinutes(s.startTime);
        const sEnd = toMinutes(s.endTime);

        if (field === "endTime" && currentSlot.startTime) {
          const currentStart = toMinutes(currentSlot.startTime);

          return currentStart < sEnd && valueMinutes > sStart;
        }

        if (field === "startTime" && currentSlot.endTime) {
          const currentEnd = toMinutes(currentSlot.endTime);

          if (view === "hours")
            return currentEnd > sStart && valueMinutes + 59 < sEnd;

          return currentEnd > sStart && valueMinutes < sEnd;
        }

        if (view === "hours")
          return valueMinutes > sStart && valueMinutes + 59 < sEnd;

        return field === "startTime"
          ? valueMinutes >= sStart && valueMinutes < sEnd
          : valueMinutes > sStart && valueMinutes <= sEnd;
      });
    };

  return (
    <Stack width="100%" gap={2}>
      <Typography color={error ? "error" : "text.secondary"} variant="body2">
        {tOrganizations("localBusiness.openingHours.label")}
      </Typography>
      {schedules.map((slot, index) => {
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
                  value={slot.days}
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
                    toTimeValue(slot.endTime)?.subtract(1, "minute") ||
                    undefined
                  }
                  onChange={(v) => updateScheduleTime(index, "startTime", v)}
                  shouldDisableTime={makeShouldDisableTime(index, "startTime")}
                  slotProps={{
                    textField: { error: hasConflict, size: "small" },
                  }}
                  value={toTimeValue(slot.startTime)}
                />
                <Typography textAlign="center" variant="body2">
                  {tOrganizations("localBusiness.openingHours.to")}
                </Typography>
                <TimePicker
                  format="HH:mm"
                  minTime={
                    toTimeValue(slot.startTime)?.add(1, "minute") || undefined
                  }
                  onChange={(v) => updateScheduleTime(index, "endTime", v)}
                  shouldDisableTime={makeShouldDisableTime(index, "endTime")}
                  slotProps={{
                    textField: { error: hasConflict, size: "small" },
                  }}
                  value={toTimeValue(slot.endTime)}
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
