// https://v7.mui.com/joy-ui/react-radio-button/#ExamplePaymentChannels.tsx
// https://v7.mui.com/joy-ui/react-radio-button/#RadioPositionEnd.tsx

"use client";

import { Fragment } from "react";

import {
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFormControlLabel = styled(FormControlLabel)(({ theme }) => ({
  margin: 0,
  padding: theme.spacing(1, 2),
  flexDirection: "row-reverse",
  justifyContent: "space-between",
}));

interface ListRadioGroupOption {
  icon?: React.ElementType;
  label: string;
  value: string;
}

interface ListRadioGroupProps {
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
  options: ListRadioGroupOption[];
  value: string;
}

const ListRadioGroup = ({
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
  </Stack>
);

export default ListRadioGroup;
