import dayjs, { type Dayjs } from "dayjs";

export const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
export type Day = (typeof DAYS)[number];

const DAYS_SET = new Set<string>(DAYS);
const isDayCode = (code: string): code is Day => DAYS_SET.has(code);

const parseDays = (daysPart: string): Day[] => {
  const days = new Set<Day>();

  for (const segment of daysPart.split(",")) {
    if (isDayCode(segment)) {
      days.add(segment);
      continue;
    }

    const [start, end, ...rest] = segment.split("-");
    if (rest.length > 0 || !isDayCode(start) || !isDayCode(end)) continue;

    const startIdx = DAYS.indexOf(start);
    const endIdx = DAYS.indexOf(end);
    if (startIdx <= endIdx)
      for (const day of DAYS.slice(startIdx, endIdx + 1)) days.add(day);
  }

  return DAYS.filter((day) => days.has(day));
};

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const isOvernight = ({
  startTime,
  endTime,
}: Pick<Schedule, "startTime" | "endTime">): boolean =>
  toMinutes(endTime) <= toMinutes(startTime);

export const hasNextDayTail = (
  schedule: Pick<Schedule, "startTime" | "endTime">,
): boolean => isOvernight(schedule) && toMinutes(schedule.endTime) > 0;

const isAllDay = ({ startTime, endTime }: Schedule): boolean =>
  toMinutes(startTime) === 0 && toMinutes(endTime) === 0;

export const toTimeDayjs = (time: string): Dayjs | null =>
  time ? dayjs(`2000-01-01T${time}`) : null;

const groupConsecutiveDays = (days: Day[]): Day[][] =>
  DAYS.filter((day) => days.includes(day)).reduce<Day[][]>((runs, day) => {
    const run = runs[runs.length - 1];

    if (run && DAYS.indexOf(day) === DAYS.indexOf(run[run.length - 1]) + 1)
      run.push(day);
    else runs.push([day]);

    return runs;
  }, []);

const serializeDays = (days: Day[]): string =>
  groupConsecutiveDays(days)
    .map((run) =>
      run.length === 1 ? run[0] : `${run[0]}-${run[run.length - 1]}`,
    )
    .join(",");

export interface Schedule {
  id: string;
  days: Day[];
  startTime: string;
  endTime: string;
}

export const parseOpeningHours = (value: string): Schedule[] => {
  if (!value?.trim()) return [];

  return value.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    const spaceIdx = trimmed.indexOf(" ");

    const days = parseDays(
      spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx),
    );
    if (days.length === 0) return [];

    if (spaceIdx === -1)
      return [
        { id: crypto.randomUUID(), days, startTime: "00:00", endTime: "00:00" },
      ];

    return trimmed
      .slice(spaceIdx + 1)
      .split(",")
      .map((segment) => {
        const dashIdx = segment.indexOf("-");

        return {
          id: crypto.randomUUID(),
          days,
          startTime:
            dashIdx !== -1 ? segment.slice(0, dashIdx).trim() : segment.trim(),
          endTime: dashIdx !== -1 ? segment.slice(dashIdx + 1).trim() : "",
        };
      });
  });
};

type PartialSchedule = Pick<Schedule, "days" | "startTime" | "endTime">;

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
        // 跨午夜區段的尾巴落在隔日，不能和同一天的下個區段相接
        if (isOvernight(a)) continue;

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

  const normalized = mergeSchedulesByTime(
    mergeConsecutiveSchedules(mergeSchedulesByTime(complete)),
  );

  const completePart = normalized
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

const DAY_MINUTES = 24 * 60;
const WEEK_MINUTES = DAYS.length * DAY_MINUTES;

interface WeekInterval {
  day: Day;
  start: number;
  end: number;
}

const getWeekIntervals = ({
  days,
  startTime,
  endTime,
}: Pick<Schedule, "days" | "startTime" | "endTime">): WeekInterval[] => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  const length = isOvernight({ startTime, endTime })
    ? end + 24 * 60 - start
    : end - start;

  return days.map((day) => {
    const offset = DAYS.indexOf(day) * 24 * 60 + start;

    return { day, start: offset, end: offset + length };
  });
};

const isOverlapping = (a: WeekInterval, b: WeekInterval): boolean =>
  [-WEEK_MINUTES, 0, WEEK_MINUTES].some(
    (shift) => a.start < b.end + shift && b.start + shift < a.end,
  );

export const getConflictingSchedules = (
  schedules: Schedule[],
): Map<string, Set<Day>> => {
  const result = new Map<string, Set<Day>>();

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i];
      const b = schedules[j];

      if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue;

      const aDays = result.get(a.id) ?? new Set<Day>();
      const bDays = result.get(b.id) ?? new Set<Day>();
      let conflicted = false;

      for (const aInterval of getWeekIntervals(a)) {
        for (const bInterval of getWeekIntervals(b)) {
          if (!isOverlapping(aInterval, bInterval)) continue;

          aDays.add(aInterval.day);
          bDays.add(bInterval.day);
          conflicted = true;
        }
      }

      if (conflicted) {
        result.set(a.id, aDays);
        result.set(b.id, bDays);
      }
    }
  }

  return result;
};

const SCHEDULE_CACHE_LIMIT = 64;
const scheduleCache = new Map<string, Schedule[]>();

const getSchedules = (value: string): Schedule[] => {
  const cached = scheduleCache.get(value);
  if (cached) return cached;

  const schedules = parseOpeningHours(value);
  scheduleCache.set(value, schedules);

  if (scheduleCache.size > SCHEDULE_CACHE_LIMIT) {
    const oldest = scheduleCache.keys().next().value;
    if (oldest !== undefined) scheduleCache.delete(oldest);
  }

  return schedules;
};

export const hasOpeningHoursConflict = (value: string): boolean =>
  getConflictingSchedules(getSchedules(value)).size > 0;

export const hasIncompleteOpeningHours = (value: string): boolean =>
  value
    .split("\n")
    .filter(Boolean)
    .some((line) => line.indexOf(" ") < 1);

const intervalCache = new Map<string, WeekInterval[]>();

const getOpenIntervals = (openingHours: string): WeekInterval[] => {
  const cached = intervalCache.get(openingHours);
  if (cached) return cached;

  const intervals = getSchedules(openingHours)
    .filter(({ startTime, endTime }) => startTime && endTime)
    .flatMap(getWeekIntervals);
  intervalCache.set(openingHours, intervals);

  if (intervalCache.size > SCHEDULE_CACHE_LIMIT) {
    const oldest = intervalCache.keys().next().value;
    if (oldest !== undefined) intervalCache.delete(oldest);
  }

  return intervals;
};

const containsWeekMinute = ({ start, end }: WeekInterval, minute: number) =>
  [-WEEK_MINUTES, 0, WEEK_MINUTES].some(
    (shift) => start + shift <= minute && minute < end + shift,
  );

const isWeekMinuteOpen = (openIntervals: WeekInterval[], minute: number) =>
  openIntervals.some((interval) => containsWeekMinute(interval, minute));

// 中間跨過店休空檔是允許的（兩班制的店寫 11:00-21:00 才不會被擋），但跨午夜只有店家自己
// 跨夜營業時才成立 —— 否則 20:00-09:00 會被讀成隔天，在不跨夜的店等於整晚都不供應
const isIntervalWithinOpeningHours = (
  openIntervals: WeekInterval[],
  { start, end }: WeekInterval,
): boolean => {
  const midnight = (Math.floor(start / DAY_MINUTES) + 1) * DAY_MINUTES;

  return (
    isWeekMinuteOpen(openIntervals, start) &&
    isWeekMinuteOpen(openIntervals, end - 1) &&
    (midnight >= end || isWeekMinuteOpen(openIntervals, midnight))
  );
};

export const isBoundWithinOpeningHours = (
  openingHours: string,
  {
    days,
    startTime,
    endTime,
  }: Pick<Schedule, "days" | "startTime" | "endTime">,
  bound: "start" | "end",
): boolean => {
  const openIntervals = getOpenIntervals(openingHours);
  if (openIntervals.length === 0) return true;

  const selectedDays = days.length > 0 ? days : [...DAYS];

  if (startTime && endTime)
    return getWeekIntervals({ days: selectedDays, startTime, endTime }).some(
      (interval) => isIntervalWithinOpeningHours(openIntervals, interval),
    );

  if (bound === "start")
    return selectedDays.some((day) =>
      isWeekMinuteOpen(
        openIntervals,
        DAYS.indexOf(day) * DAY_MINUTES + toMinutes(startTime),
      ),
    );

  const end = toMinutes(endTime);
  const offsets =
    end === 0 ? [DAY_MINUTES - 1] : [end - 1, DAY_MINUTES + end - 1];

  return selectedDays.some((day) =>
    offsets.some((offset) =>
      isWeekMinuteOpen(
        openIntervals,
        (DAYS.indexOf(day) * DAY_MINUTES + offset) % WEEK_MINUTES,
      ),
    ),
  );
};

const isDayOpen = (openIntervals: WeekInterval[], day: Day): boolean => {
  const start = DAYS.indexOf(day) * DAY_MINUTES;

  return openIntervals.some((interval) =>
    isOverlapping({ day, start, end: start + DAY_MINUTES }, interval),
  );
};

export const getSchedulesOutsideOpeningHours = (
  schedules: Schedule[],
  openingHours: string,
): Map<string, Set<Day>> => {
  const result = new Map<string, Set<Day>>();

  const openIntervals = getOpenIntervals(openingHours);
  if (openIntervals.length === 0) return result;

  for (const schedule of schedules) {
    const days =
      schedule.startTime && schedule.endTime
        ? getWeekIntervals(schedule)
            .filter(
              (interval) =>
                !isIntervalWithinOpeningHours(openIntervals, interval),
            )
            .map(({ day }) => day)
        : schedule.days.filter((day) => !isDayOpen(openIntervals, day));

    if (days.length > 0) result.set(schedule.id, new Set(days));
  }

  return result;
};

const getDaySchedules = (value: string, at: Dayjs): Schedule[] => {
  const day = DAYS[(at.day() + 6) % 7];

  return getSchedules(value).filter(
    (schedule) =>
      schedule.days.includes(day) && !!schedule.startTime && !!schedule.endTime,
  );
};

export const isUnrestricted = (value: string): boolean =>
  getSchedules(value).length === 0;

export const isOpenOn = (value: string, at: Dayjs): boolean =>
  isUnrestricted(value) ||
  getDaySchedules(value, at).length > 0 ||
  getDaySchedules(value, at.subtract(1, "day")).some(hasNextDayTail);

export const getCloseTimeAt = (value: string, at: Dayjs): Dayjs | null => {
  const minutes = at.hour() * 60 + at.minute();
  const startOfDay = at.startOf("day");

  const current = getDaySchedules(value, at).find((schedule) =>
    isOvernight(schedule)
      ? minutes >= toMinutes(schedule.startTime)
      : minutes >= toMinutes(schedule.startTime) &&
        minutes < toMinutes(schedule.endTime),
  );
  if (current)
    return startOfDay
      .add(isOvernight(current) ? 1 : 0, "day")
      .add(toMinutes(current.endTime), "minute");

  const previous = getDaySchedules(value, at.subtract(1, "day")).find(
    (schedule) =>
      isOvernight(schedule) && minutes < toMinutes(schedule.endTime),
  );

  return previous
    ? startOfDay.add(toMinutes(previous.endTime), "minute")
    : null;
};

export const isOpenAt = (value: string, at: Dayjs): boolean =>
  isUnrestricted(value) || !!getCloseTimeAt(value, at);

export interface OpeningHoursDisplayConfig {
  formatDay: (day: Day) => string;
  formatNextDayTime: (time: string) => string;
  allDayLabel: string;
  rangeSeparator: string;
  delimiter: string;
}

export const formatDays = (
  days: Day[],
  {
    formatDay,
    rangeSeparator,
    delimiter,
  }: Pick<
    OpeningHoursDisplayConfig,
    "formatDay" | "rangeSeparator" | "delimiter"
  >,
): string =>
  groupConsecutiveDays(days)
    .map((run) =>
      run.length === 1
        ? formatDay(run[0])
        : `${formatDay(run[0])}${rangeSeparator}${formatDay(run[run.length - 1])}`,
    )
    .join(delimiter);

export const formatOpeningHoursForDisplay = (
  value: string,
  config: OpeningHoursDisplayConfig,
): string[] => {
  const schedules = getSchedules(value);
  const keys = [...new Set(schedules.map(({ days }) => days.join(",")))];

  return keys.map((key) => {
    const group = schedules.filter(({ days }) => days.join(",") === key);
    const times = group
      .filter(({ startTime, endTime }) => startTime && endTime)
      .map((schedule) =>
        isAllDay(schedule)
          ? config.allDayLabel
          : `${schedule.startTime}–${
              hasNextDayTail(schedule)
                ? config.formatNextDayTime(schedule.endTime)
                : schedule.endTime
            }`,
      );

    const daysLabel = formatDays(group[0].days, config);

    return times.length === 0
      ? daysLabel
      : `${daysLabel}　${times.join(config.delimiter)}`;
  });
};
