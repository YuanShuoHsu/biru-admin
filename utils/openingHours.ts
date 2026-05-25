// vibe coding

import dayjs, { type Dayjs } from "dayjs";

export const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export type Day = (typeof DAYS)[number];

const DAYS_SET = new Set<string>(DAYS);
const isDayCode = (code: string): code is Day => DAYS_SET.has(code);

const parseDays = (daysPart: string): Day[] => {
  if (daysPart.includes(",")) return daysPart.split(",").filter(isDayCode);

  const parts = daysPart.split("-");
  if (parts.length === 2 && isDayCode(parts[0]) && isDayCode(parts[1])) {
    const startIdx = DAYS.indexOf(parts[0]);
    const endIdx = DAYS.indexOf(parts[1]);
    if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx)
      return DAYS.slice(startIdx, endIdx + 1);
  }

  if (isDayCode(daysPart)) return [daysPart];

  return [];
};

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const toTimeDayjs = (time: string): Dayjs | null =>
  time ? dayjs(`2000-01-01T${time}`) : null;

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

export interface Schedule {
  id: string;
  days: Day[];
  startTime: string;
  endTime: string;
}

type PartialSchedule = Pick<Schedule, "days" | "startTime" | "endTime">;

export const parseOpeningHours = (value: string): Schedule[] => {
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

const mergeSchedulesByTime = (
  schedules: PartialSchedule[],
): PartialSchedule[] => {
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

const mergeConsecutiveSchedules = (
  schedules: PartialSchedule[],
): PartialSchedule[] => {
  let result = schedules.filter(({ days }) => days.length > 0);
  let changed = true;

  while (changed) {
    changed = false;

    outer: for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const a = result[i];
        const b = result[j];

        if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue;
        if (a.endTime !== b.startTime) continue;

        const bDaysSet = new Set(b.days);
        const commonDays = a.days.filter((day) => bDaysSet.has(day));
        if (commonDays.length === 0) continue;

        const commonDaysSet = new Set(commonDays);
        const next = result.flatMap((s, idx) => {
          if (idx !== i && idx !== j) return [s];
          const remaining = s.days.filter((d) => !commonDaysSet.has(d));
          return remaining.length > 0 ? [{ ...s, days: remaining }] : [];
        });
        next.push({
          days: commonDays,
          startTime: a.startTime,
          endTime: b.endTime,
        });

        result = next;
        changed = true;
        break outer;
      }
    }
  }

  return result;
};

export const serializeOpeningHours = (schedules: Schedule[]): string => {
  const complete: Schedule[] = [];
  const incomplete: Schedule[] = [];

  for (const schedule of schedules) {
    const { days, startTime, endTime } = schedule;

    if (days.length > 0 && startTime && endTime) {
      complete.push(schedule);
    } else if (
      (days.length > 0 && (!startTime || !endTime)) ||
      (days.length === 0 && (startTime || endTime))
    ) {
      incomplete.push(schedule);
    }
  }

  const deduped = mergeSchedulesByTime(
    mergeConsecutiveSchedules(mergeSchedulesByTime(complete)),
  );

  const completePart = deduped
    .sort(
      (a, b) =>
        Math.min(...a.days.map((d) => DAYS.indexOf(d))) -
        Math.min(...b.days.map((d) => DAYS.indexOf(d))),
    )
    .map(
      ({ days, startTime, endTime }) =>
        `${serializeDays(days)} ${startTime}-${endTime}`,
    )
    .join("\n");

  const incompletePart = incomplete
    .map(({ days, startTime, endTime }) =>
      days.length > 0 ? serializeDays(days) : `${startTime}-${endTime}`,
    )
    .join("\n");

  return [completePart, incompletePart].filter(Boolean).join("\n");
};

export const getConflictingSchedules = (
  schedules: Schedule[],
): Map<string, Set<Day>> => {
  const result = new Map<string, Set<Day>>();

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];

      if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue;

      const aStart = toMinutes(a.startTime);
      const aEnd = toMinutes(a.endTime);
      const bStart = toMinutes(b.startTime);
      const bEnd = toMinutes(b.endTime);

      if (!(aStart < bEnd && bStart < aEnd)) continue;

      const bDaysSet = new Set(b.days);
      const overlapping = a.days.filter((day) => bDaysSet.has(day));
      if (overlapping.length === 0) continue;

      const aDays = result.get(a.id) ?? new Set<Day>();
      const bDays = result.get(b.id) ?? new Set<Day>();
      overlapping.forEach((day) => {
        aDays.add(day);
        bDays.add(day);
      });
      result.set(a.id, aDays);
      result.set(b.id, bDays);
    }
  }

  return result;
};

export const hasOpeningHoursConflict = (value: string): boolean =>
  getConflictingSchedules(parseOpeningHours(value)).size > 0;
