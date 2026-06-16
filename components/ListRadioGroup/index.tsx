// https://v7.mui.com/joy-ui/react-radio-button/#ExamplePaymentChannels.tsx
// https://v7.mui.com/joy-ui/react-radio-button/#RadioPositionEnd.tsx

"use client";

import { Fragment } from "react";

import {
  Divider,
  FormControlLabel,
  FormHelperText,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
  type FormHelperTextProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(1, 2),
  flexDirection: "row-reverse",
  justifyContent: "space-between",
}));

interface ListRadioGroupOption<T extends string> {
  icon?: React.ElementType;
  label: string;
  value: T;
}

interface ListRadioGroupProps<T extends string> {
  error?: FormHelperTextProps["error"];
  helperText?: FormHelperTextProps["children"];
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, value: T) => void;
  options: ListRadioGroupOption<T>[];
  value: T;
}

const ListRadioGroup = <T extends string>({
  error,
  helperText,
  label,
  onChange,
  options,
  value,
}: ListRadioGroupProps<T>) => (
  <Stack width="100%" gap={2}>
    <Typography color="text.secondary" fontWeight="bold" variant="subtitle2">
      {label}
    </Typography>
    <Paper variant="outlined">
      <RadioGroup
        onChange={(event, optionValue) => {
          const option = options.find(({ value }) => value === optionValue);
          if (option) onChange(event, option.value);
        }}
        value={value}
      >
        {options.map(({ icon: Icon, label, value: optionValue }, index) => (
          <Fragment key={optionValue}>
            {index !== 0 && <Divider />}
            <StyledFormControlLabel
              control={<Radio size="small" />}
              label={
                <Stack direction="row" alignItems="center" gap={2}>
                  {Icon && <Icon fontSize="small" />}
                  <Typography variant="body2">{label}</Typography>
                </Stack>
              }
              value={optionValue}
            />
          </Fragment>
        ))}
      </RadioGroup>
    </Paper>
    {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
  </Stack>
);

export default ListRadioGroup;
