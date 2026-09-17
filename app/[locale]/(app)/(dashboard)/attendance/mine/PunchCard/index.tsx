"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type ReactNode, useRef, useState } from "react";
import useSWR from "swr";

import { Login, Logout, Pause, PlayArrow } from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import type {
  AttendanceEventAction,
  AttendanceShift,
} from "@/types/attendance";

import { attendanceErrorKey, attendancePath } from "@/utils/attendance";
import { fetcher } from "@/utils/fetcher";

const PUNCH_ICONS: Record<AttendanceEventAction, ReactNode> = {
  breakEnd: <PlayArrow />,
  breakStart: <Pause />,
  clockIn: <Login />,
  clockOut: <Logout />,
};

interface PunchCardProps {
  onPunched: () => void;
  organizationSlug: string;
  shifts: AttendanceShift[];
}

const PunchCard = ({
  onPunched,
  organizationSlug,
  shifts: initialShifts,
}: PunchCardProps) => {
  const [busy, setBusy] = useState<string | null>(null);

  // 同一班次同一動作重試必須沿用第一次的 key，否則後端會把重送當成第二次打卡
  const punchKeys = useRef(new Map<string, string>());

  const format = useFormatter();

  const tAttendance = useTranslations("attendance");

  const { data: shifts = initialShifts, mutate } = useSWR<AttendanceShift[]>(
    attendancePath(organizationSlug, "me", "shifts/punchable"),
    fetcher,
    { fallbackData: initialShifts },
  );

  const handlePunch = async (
    shift: AttendanceShift,
    action: AttendanceEventAction,
  ) => {
    if (busy) return;

    const pending = `${shift.id}:${action}`;

    setBusy(pending);

    let position: GeolocationPosition;

    try {
      position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) reject(new Error("unsupported"));
        else
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 15000,
          });
      });
    } catch {
      enqueueSnackbar(tAttendance("locationError"), { variant: "error" });
      setBusy(null);

      return;
    }

    const idempotencyKey =
      punchKeys.current.get(pending) ?? crypto.randomUUID();

    punchKeys.current.set(pending, idempotencyKey);

    try {
      await fetcher(attendancePath(organizationSlug, "all", "punch"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shiftId: shift.id,
          action,
          idempotencyKey,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          locatedAt: new Date(position.timestamp).toISOString(),
        }),
      });

      punchKeys.current.delete(pending);
      enqueueSnackbar(tAttendance("success"), { variant: "success" });
      mutate();
      onPunched();
    } catch (error) {
      enqueueSnackbar(tAttendance(attendanceErrorKey(error)), {
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack gap={2}>
          <Typography variant="h6">
            {tAttendance("mine.punch.title")}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {tAttendance("locationHint")}
          </Typography>
          {shifts.length ? (
            shifts.map((shift) => (
              <Stack
                alignItems={{ sm: "center" }}
                direction={{ sm: "row" }}
                gap={1.5}
                key={shift.id}
              >
                <Stack alignItems="center" direction="row" gap={1} flex={1}>
                  <Typography>
                    {format.dateTimeRange(
                      new Date(shift.startsAt),
                      new Date(shift.endsAt),
                      "compact",
                    )}
                  </Typography>
                  <Chip
                    color={shift.state === "working" ? "success" : "default"}
                    label={tAttendance(`state.options.${shift.state}`)}
                    size="small"
                  />
                </Stack>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {shift.availableActions.map((action) => (
                    <Button
                      disabled={!!busy}
                      key={action}
                      loading={busy === `${shift.id}:${action}`}
                      onClick={() => void handlePunch(shift, action)}
                      startIcon={PUNCH_ICONS[action]}
                      variant="contained"
                    >
                      {tAttendance(`eventAction.options.${action}`)}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            ))
          ) : (
            <Typography color="text.secondary">
              {tAttendance("mine.punch.empty")}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default PunchCard;
