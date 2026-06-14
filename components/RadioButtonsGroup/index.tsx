// https://mui.com/material-ui/react-radio-button/#ControlledRadioButtonsGroup.tsx

import { useId } from "react";

import StyledFormControlLabel from "@/components/StyledFormControlLabel";

import {
  FormControl,
  FormHelperText,
  FormLabel,
  RadioGroup,
  type FormControlLabelProps,
  type FormControlProps,
  type FormHelperTextProps,
  type FormLabelProps,
  type RadioGroupProps,
} from "@mui/material";

interface RadioButtonsGroupProps extends Omit<FormControlProps, "onChange"> {
  helperText: FormHelperTextProps["children"];
  label: FormLabelProps["children"];
  onChange: RadioGroupProps["onChange"];
  options: FormControlLabelProps[];
  value: string;
}

const RadioButtonsGroup = ({
  helperText,
  label,
  onChange,
  options,
  value,
  ...props
}: RadioButtonsGroupProps) => {
  const id = useId();

  return (
    <FormControl variant="standard" {...props}>
      <FormLabel id={`${id}-label`}>{label}</FormLabel>
      <RadioGroup
        aria-labelledby={`${id}-label`}
        name={`${id}-radio-buttons-group`}
        onChange={onChange}
        value={value}
      >
        {options.map((option) => (
          <StyledFormControlLabel
            key={String(option.value)}
            {...option}
            checked={value === option.value}
          />
        ))}
      </RadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default RadioButtonsGroup;
