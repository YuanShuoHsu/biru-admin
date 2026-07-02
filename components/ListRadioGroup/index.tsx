// https://v7.mui.com/joy-ui/react-radio-button/#ExamplePaymentChannels.tsx
// https://v7.mui.com/joy-ui/react-radio-button/#RadioPositionEnd.tsx

"use client";

import { Fragment } from "react";

import {
  Chip,
  Divider,
  FormControlLabel,
  FormHelperText,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  type FormHelperTextProps,
  type RadioGroupProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(1, 2),
  flexDirection: "row-reverse",
  justifyContent: "space-between",
}));

interface ListRadioGroupOption {
  disabled?: boolean;
  disabledReason?: string;
  icon?: React.ReactNode;
  label: string;
  value: string;
}

interface ListRadioGroupProps {
  error?: FormHelperTextProps["error"];
  helperText?: FormHelperTextProps["children"];
  label: string;
  onChange: RadioGroupProps["onChange"];
  options: ListRadioGroupOption[];
  value: string;
}

const ListRadioGroup = ({
  error,
  helperText,
  label,
  onChange,
  options,
  value,
}: ListRadioGroupProps) => (
  <Stack width="100%" gap={2}>
    <Typography color="text.secondary" fontWeight="bold" variant="subtitle2">
      {label}
    </Typography>
    <Paper variant="outlined">
      <RadioGroup onChange={onChange} value={value}>
        {options.map(
          (
            { disabled, disabledReason, icon, label, value: optionValue },
            index,
          ) => (
            <Fragment key={optionValue}>
              {index !== 0 && <Divider />}
              <StyledFormControlLabel
                control={<Radio size="small" />}
                disabled={disabled}
                label={
                  <Stack direction="row" alignItems="center" gap={2}>
                    {icon}
                    <Typography variant="body2">{label}</Typography>
                    {disabled && disabledReason && (
                      <Chip label={disabledReason} size="small" />
                    )}
                  </Stack>
                }
                value={optionValue}
              />
            </Fragment>
          ),
        )}
      </RadioGroup>
    </Paper>
    {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
  </Stack>
);

export default ListRadioGroup;
