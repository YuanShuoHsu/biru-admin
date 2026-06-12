// https://mui.com/material-ui/react-radio-button/#RadioButtonsGroup.tsx

import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  type FormControlLabelProps,
  type FormControlProps,
  type FormHelperTextProps,
  type FormLabelProps,
  type RadioGroupProps,
} from "@mui/material";

interface RadioButtonsGroupOption
  extends Omit<FormControlLabelProps, "control"> {
  value: string;
}

interface RadioButtonsGroupProps extends Omit<FormControlProps, "onChange"> {
  helperText: FormHelperTextProps["children"];
  label: FormLabelProps["children"];
  onChange: RadioGroupProps["onChange"];
  options: RadioButtonsGroupOption[];
  value: string;
}

const RadioButtonsGroup = ({
  helperText,
  label,
  onChange,
  options,
  value,
  ...props
}: RadioButtonsGroupProps) => (
  <FormControl component="fieldset" variant="standard" {...props}>
    <FormLabel component="legend">{label}</FormLabel>
    <RadioGroup value={value} onChange={onChange}>
      {options.map(({ value: optionValue, ...optionProps }) => (
        <FormControlLabel
          key={optionValue}
          {...optionProps}
          control={<Radio size="small" />}
          value={optionValue}
        />
      ))}
    </RadioGroup>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

export default RadioButtonsGroup;
