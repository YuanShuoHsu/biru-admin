"use client";

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
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import {
  DAYS,
  type Day,
  type Schedule,
  getConflictingSchedules,
  parseOpeningHours,
  serializeOpeningHours,
  toTimeDayjs,
} from "@/utils/openingHours";

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

interface OpeningHoursFieldProps {
  error?: boolean;
  onChange: (value: string) => void;
  value?: string;
}

const OpeningHoursField = ({
  error,
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

  const scheduleConflicts = getConflictingSchedules(schedules);

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
    <Stack width="100%" gap={2}>
      <Typography color={error ? "error" : "text.secondary"} variant="body2">
        {tOrganizations("localBusiness.openingHours.label")}
      </Typography>
      {schedules.map(({ id, days, startTime, endTime }) => {
        const conflictingDays = scheduleConflicts.get(id);
        const hasConflict = !!conflictingDays;
        const hasMissingDays =
          error && days.length === 0 && (!!startTime || !!endTime);
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
                          : "standard"
                      }
                      key={day}
                      value={day}
                    >
                      {tOrganizations(`localBusiness.openingHours.days.${day}`)}
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
                  format="HH:mm"
                  maxTime={toTimeDayjs(endTime)?.subtract(1, "minute")}
                  onChange={(time) =>
                    handleScheduleChange(id, {
                      startTime: time?.isValid() ? time.format("HH:mm") : "",
                    })
                  }
                  slotProps={{
                    field: { clearable: true },
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
                  slotProps={{
                    field: { clearable: true },
                    textField: {
                      error: hasConflict || hasEndTimeError,
                      helperText: hasEndTimeError
                        ? tOrganizations(
                            "localBusiness.openingHours.missingEndTime",
                          )
                        : undefined,
                      size: "small",
                    },
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
    </Stack>
  );
};

export default OpeningHoursField;
