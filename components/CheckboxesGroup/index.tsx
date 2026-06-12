// https://mui.com/material-ui/react-checkbox/#CheckboxesGroup.tsx

import { Fragment, type ChangeEvent } from "react";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  type FormControlLabelProps,
  type FormControlProps,
  type FormGroupProps,
  type FormHelperTextProps,
  type FormLabelProps,
} from "@mui/material";

interface CheckboxesGroupOption extends Omit<FormControlLabelProps, "control"> {
  children: FormGroupProps["children"];
  value: string;
}

interface CheckboxesGroupProps extends Omit<FormControlProps, "onChange"> {
  helperText: FormHelperTextProps["children"];
  label: FormLabelProps["children"];
  onChange: (event: ChangeEvent<HTMLInputElement>, value: string[]) => void;
  options: CheckboxesGroupOption[];
  value: string[];
}

const CheckboxesGroup = ({
  helperText,
  label,
  onChange,
  options,
  value,
  ...props
}: CheckboxesGroupProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;

    onChange(
      event,
      checked
        ? [...value, name]
        : value.filter((selected) => selected !== name),
    );
  };

  return (
    <FormControl component="fieldset" variant="standard" {...props}>
      <FormLabel component="legend">{label}</FormLabel>
      <FormGroup>
        {options.map(({ children, value: optionValue, ...optionProps }) => (
          <Fragment key={optionValue}>
            <FormControlLabel
              {...optionProps}
              control={
                <Checkbox
                  checked={value.includes(optionValue)}
                  name={optionValue}
                  onChange={handleChange}
                  size="small"
                />
              }
            />
            {children}
          </Fragment>
        ))}
      </FormGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default CheckboxesGroup;
