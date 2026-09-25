"use client";

import { useTranslations } from "next-intl";

import { Stack, TextField } from "@mui/material";
import type { GridFilterInputValueProps } from "@mui/x-data-grid";

const DurationFilterInputValue = ({
  item,
  applyValue,
}: GridFilterInputValueProps) => {
  const tDuration = useTranslations("dataGrid.toolbar.filter.duration");

  const total =
    item.value === "" || item.value == null ? null : Number(item.value);
  const hours = total === null ? "" : Math.floor(total / 60);
  const minutes = total === null ? "" : total % 60;

  const handleChange = (nextHours: string, nextMinutes: string) =>
    applyValue({
      ...item,
      value:
        nextHours === "" && nextMinutes === ""
          ? ""
          : String(Number(nextHours) * 60 + Number(nextMinutes)),
    });

  return (
    <Stack direction="row" spacing={1}>
      <TextField
        label={tDuration("hours")}
        onChange={(event) => handleChange(event.target.value, String(minutes))}
        size="small"
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        type="number"
        value={hours}
      />
      <TextField
        label={tDuration("minutes")}
        onChange={(event) => handleChange(String(hours), event.target.value)}
        size="small"
        slotProps={{ htmlInput: { max: 59, min: 0, step: 1 } }}
        type="number"
        value={minutes}
      />
    </Stack>
  );
};

export default DurationFilterInputValue;
