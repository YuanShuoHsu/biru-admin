"use client";

import dayjs, { type Dayjs } from "dayjs";

import type { GridFilterInputValueProps } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { DateView } from "@mui/x-date-pickers/models";

export interface DateFilterInputValueProps extends GridFilterInputValueProps {
  format?: string;
  valueFormat?: string;
  views?: DateView[];
}

const DateFilterInputValue = ({
  item,
  applyValue,
  format,
  valueFormat = "YYYY-MM-DD",
  views,
}: DateFilterInputValueProps) => {
  const handleChange = (newValue: Dayjs | null) =>
    applyValue({
      ...item,
      value: newValue?.isValid() ? newValue.format(valueFormat) : "",
    });

  const handleClear = () => applyValue({ ...item, value: "" });

  return (
    <DatePicker
      disableFuture
      format={format}
      maxDate={dayjs()}
      onChange={handleChange}
      slotProps={{
        field: { clearable: true, onClear: handleClear },
        textField: {
          size: "small",
        },
      }}
      value={item.value ? dayjs(item.value) : null}
      views={views}
    />
  );
};

export default DateFilterInputValue;
