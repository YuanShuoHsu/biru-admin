"use client";

import dayjs, { type Dayjs } from "dayjs";

import type { GridFilterInputValueProps } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const DateFilterInputValue = ({
  item,
  applyValue,
}: GridFilterInputValueProps) => {
  const handleChange = (newValue: Dayjs | null) =>
    applyValue({
      ...item,
      value: newValue?.isValid() ? newValue.format("YYYY-MM-DD") : "",
    });

  const handleClear = () => applyValue({ ...item, value: "" });

  return (
    <DatePicker
      disableFuture
      maxDate={dayjs()}
      onChange={handleChange}
      slotProps={{
        field: { clearable: true, onClear: handleClear },
        textField: {
          size: "small",
        },
      }}
      value={item.value ? dayjs(item.value) : null}
    />
  );
};

export default DateFilterInputValue;
