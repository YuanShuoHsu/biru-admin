import { NumericFormat } from "react-number-format";

import { TextField } from "@mui/material";

interface CashAmountFieldProps {
  error?: string;
  helperText?: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  value: string;
}

const CashAmountField = ({
  error,
  helperText,
  label,
  name,
  onChange,
  value,
}: CashAmountFieldProps) => (
  <NumericFormat
    allowNegative={false}
    customInput={TextField}
    decimalScale={2}
    error={!!error}
    fullWidth
    helperText={error || helperText}
    isAllowed={({ floatValue }) =>
      floatValue === undefined || floatValue <= 99999999.99
    }
    label={label}
    name={name}
    onValueChange={({ value }) => onChange(value)}
    required
    thousandSeparator=","
    value={value}
    valueIsNumericString
  />
);

export default CashAmountField;
