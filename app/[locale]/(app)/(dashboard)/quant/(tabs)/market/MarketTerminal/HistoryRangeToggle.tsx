"use client";

import { useTranslations } from "next-intl";

import { HISTORY_RANGE_DAYS, type HistoryRange } from "./useAccountHistory";

import { ToggleButton, ToggleButtonGroup } from "@mui/material";

interface HistoryRangeToggleProps {
  onChange: (range: HistoryRange) => void;
  value: HistoryRange;
}

const HistoryRangeToggle = ({ onChange, value }: HistoryRangeToggleProps) => {
  const tQuant = useTranslations("quant");

  return (
    <ToggleButtonGroup
      exclusive
      onChange={(_, range: HistoryRange | null) => {
        if (range) onChange(range);
      }}
      size="small"
      value={value}
    >
      {(Object.keys(HISTORY_RANGE_DAYS) as HistoryRange[]).map((range) => (
        <ToggleButton key={range} value={range}>
          {tQuant(`account.range.${range}`)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};

export default HistoryRangeToggle;
