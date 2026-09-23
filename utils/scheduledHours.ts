import type { AttendanceShift } from "@/types/attendance";

export const scheduledHours = (
  shift: Pick<
    AttendanceShift,
    | "startsAt"
    | "endsAt"
    | "paidBreak"
    | "breakStartsAt"
    | "breakEndsAt"
    | "status"
  >,
  from: number,
  to: number,
) => {
  if (shift.status === "cancelled") return 0;

  const start = Math.max(new Date(shift.startsAt).getTime(), from);
  const end = Math.min(new Date(shift.endsAt).getTime(), to);
  const duration = Math.max(0, end - start);
  const unpaidBreak =
    !shift.paidBreak && shift.breakStartsAt && shift.breakEndsAt
      ? Math.max(
          0,
          Math.min(end, new Date(shift.breakEndsAt).getTime()) -
            Math.max(start, new Date(shift.breakStartsAt).getTime()),
        )
      : 0;

  return (duration - unpaidBreak) / 3_600_000;
};
