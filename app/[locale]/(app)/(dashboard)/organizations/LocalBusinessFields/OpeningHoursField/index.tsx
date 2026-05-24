"use client";

import { useState } from "react";

import dayjs, { type Dayjs } from "dayjs";

import { useLocale, useTranslations } from "next-intl";

import { Add, DeleteOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  FormHelperText,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { TimeView } from "@mui/x-date-pickers";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
type Day = (typeof DAYS)[number];

const DAY_LABELS: Record<string, Record<Day, string>> = {
  "zh-TW": {
    Mo: "一",
    Tu: "二",
    We: "三",
    Th: "四",
    Fr: "五",
    Sa: "六",
    Su: "日",
  },
  "zh-CN": {
    Mo: "一",
    Tu: "二",
    We: "三",
    Th: "四",
    Fr: "五",
    Sa: "六",
    Su: "日",
  },
  en: { Mo: "Mo", Tu: "Tu", We: "We", Th: "Th", Fr: "Fr", Sa: "Sa", Su: "Su" },
  ja: { Mo: "月", Tu: "火", We: "水", Th: "木", Fr: "金", Sa: "土", Su: "日" },
  ko: { Mo: "월", Tu: "화", We: "수", Th: "목", Fr: "금", Sa: "토", Su: "일" },
};

interface TimeSlot {
  days: Day[];
  startTime: string;
  endTime: string;
}

function parseDays(daysPart: string): Day[] {
  const isDayCode = (s: string): s is Day =>
    (DAYS as readonly string[]).includes(s);

  if (daysPart.includes(",")) {
    return daysPart.split(",").filter(isDayCode);
  }

  const parts = daysPart.split("-");
  if (parts.length === 2 && isDayCode(parts[0]) && isDayCode(parts[1])) {
    const startIdx = DAYS.indexOf(parts[0]);
    const endIdx = DAYS.indexOf(parts[1]);
    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
      return [...DAYS].slice(startIdx, endIdx + 1);
    }
  }

  if (isDayCode(daysPart)) return [daysPart];
  return [];
}

function parseOpeningHours(value: string): TimeSlot[] {
  if (!value?.trim()) return [];
  return value
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const trimmed = line.trim();
      const spaceIdx = trimmed.indexOf(" ");
      if (spaceIdx === -1) {
        return { days: parseDays(trimmed), startTime: "", endTime: "" };
      }
      const daysPart = trimmed.slice(0, spaceIdx);
      const timePart = trimmed.slice(spaceIdx + 1);
      const dashIdx = timePart.indexOf("-");
      const startTime = dashIdx !== -1 ? timePart.slice(0, dashIdx) : timePart;
      const endTime = dashIdx !== -1 ? timePart.slice(dashIdx + 1) : "";
      return { days: parseDays(daysPart), startTime, endTime };
    })
    .filter((slot) => slot.days.length > 0);
}

function serializeDays(days: Day[]): string {
  const indices = days.map((d) => DAYS.indexOf(d)).sort((a, b) => a - b);
  if (indices.length === 0) return "";
  if (indices.length === 1) return DAYS[indices[0]];
  const isConsecutive = indices.every(
    (idx, i) => i === 0 || idx === indices[i - 1] + 1,
  );
  if (isConsecutive) {
    return `${DAYS[indices[0]]}-${DAYS[indices[indices.length - 1]]}`;
  }
  return indices.map((i) => DAYS[i]).join(",");
}

function serializeOpeningHours(slots: TimeSlot[]): string {
  return slots
    .filter((slot) => slot.days.length > 0)
    .map((slot) => {
      const dayStr = serializeDays(slot.days);
      if (slot.startTime && slot.endTime) {
        return `${dayStr} ${slot.startTime}-${slot.endTime}`;
      }
      return dayStr;
    })
    .join("\n");
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function getConflictingSlots(slots: TimeSlot[]): Set<number> {
  const conflicting = new Set<number>();
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
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
}

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
  const locale = useLocale();
  const dayLabels = DAY_LABELS[locale] ?? DAY_LABELS["en"];

  const [slots, setSlots] = useState<TimeSlot[]>(() =>
    parseOpeningHours(value),
  );

  const conflicting = getConflictingSlots(slots);

  const updateSlots = (newSlots: TimeSlot[]) => {
    setSlots(newSlots);
    onChange(serializeOpeningHours(newSlots));
  };

  const addSlot = () =>
    updateSlots([...slots, { days: [], startTime: "", endTime: "" }]);

  const removeSlot = (index: number) =>
    updateSlots(slots.filter((_, i) => i !== index));

  const updateSlotDays = (index: number, days: Day[]) =>
    updateSlots(
      slots.map((slot, i) => (i === index ? { ...slot, days } : slot)),
    );

  const updateSlotTime = (
    index: number,
    field: "startTime" | "endTime",
    value: Dayjs | null,
  ) => {
    const time = value?.isValid() ? value.format("HH:mm") : "";
    updateSlots(
      slots.map((slot, i) => (i === index ? { ...slot, [field]: time } : slot)),
    );
  };

  const toTimeValue = (time: string): Dayjs | null =>
    time ? dayjs(`2000-01-01T${time}`) : null;

  const makeShouldDisableTime =
    (slotIndex: number, field: "startTime" | "endTime") =>
    (value: Dayjs, view: TimeView) => {
      if (view === "seconds") return false;
      const currentDays = slots[slotIndex].days;
      if (currentDays.length === 0) return false;
      const currentSlot = slots[slotIndex];
      const valueMinutes = value.hour() * 60 + value.minute();

      return slots.some((s, i) => {
        if (i === slotIndex || !s.startTime || !s.endTime) return false;
        if (!s.days.some((d) => currentDays.includes(d))) return false;
        const sStart = toMinutes(s.startTime);
        const sEnd = toMinutes(s.endTime);

        if (field === "endTime" && currentSlot.startTime) {
          // 衝突條件：currentStart < sEnd && B_end > sStart
          const currentStart = toMinutes(currentSlot.startTime);
          return currentStart < sEnd && valueMinutes > sStart;
        }

        if (field === "startTime" && currentSlot.endTime) {
          // 衝突條件：currentEnd > sStart && B_start < sEnd
          const currentEnd = toMinutes(currentSlot.endTime);
          // hours view：整個小時的所有分鐘都無效才 disable
          if (view === "hours")
            return currentEnd > sStart && valueMinutes + 59 < sEnd;
          return currentEnd > sStart && valueMinutes < sEnd;
        }

        // 另一端尚未設定，用保守的範圍檢查
        if (view === "hours")
          return valueMinutes > sStart && valueMinutes + 59 < sEnd;
        return field === "startTime"
          ? valueMinutes >= sStart && valueMinutes < sEnd
          : valueMinutes > sStart && valueMinutes <= sEnd;
      });
    };

  return (
    <Stack spacing={1.5}>
      <Typography color={error ? "error" : "text.secondary"} variant="body2">
        {tOrganizations("localBusiness.openingHours.label")}
      </Typography>
      {slots.map((slot, index) => {
        const hasConflict = conflicting.has(index);
        return (
          <Stack key={index} spacing={0.5}>
            <Box
              sx={{
                alignItems: "center",
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              <ToggleButtonGroup
                onChange={(_, newDays: Day[]) => updateSlotDays(index, newDays)}
                size="small"
                value={slot.days}
              >
                {DAYS.map((day) => (
                  <ToggleButton
                    color={hasConflict ? "error" : "standard"}
                    key={day}
                    value={day}
                  >
                    {dayLabels[day]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <TimePicker
                format="HH:mm"
                maxTime={
                  toTimeValue(slot.endTime)?.subtract(1, "minute") || undefined
                }
                onChange={(v) => updateSlotTime(index, "startTime", v)}
                shouldDisableTime={makeShouldDisableTime(index, "startTime")}
                slotProps={{
                  textField: {
                    error: hasConflict,
                    size: "small",
                    sx: { width: 120 },
                  },
                }}
                value={toTimeValue(slot.startTime)}
              />
              <Typography variant="body2">
                {tOrganizations("localBusiness.openingHours.to")}
              </Typography>
              <TimePicker
                format="HH:mm"
                minTime={
                  toTimeValue(slot.startTime)?.add(1, "minute") || undefined
                }
                onChange={(v) => updateSlotTime(index, "endTime", v)}
                shouldDisableTime={makeShouldDisableTime(index, "endTime")}
                slotProps={{
                  textField: {
                    error: hasConflict,
                    size: "small",
                    sx: { width: 120 },
                  },
                }}
                value={toTimeValue(slot.endTime)}
              />
              <IconButton onClick={() => removeSlot(index)} size="small">
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Box>
            {hasConflict && (
              <FormHelperText error>
                {tOrganizations("localBusiness.openingHours.conflict")}
              </FormHelperText>
            )}
          </Stack>
        );
      })}
      <Box>
        <Button
          onClick={addSlot}
          size="small"
          startIcon={<Add />}
          variant="outlined"
        >
          {tOrganizations("localBusiness.openingHours.addSlot")}
        </Button>
      </Box>
      {helperText && (
        <FormHelperText error={error}>{helperText}</FormHelperText>
      )}
    </Stack>
  );
};

export default OpeningHoursField;
