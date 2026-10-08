// https://mui.com/material-ui/react-number-field/#FieldDemo.tsx

import { useId } from "react";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";

import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledInputAdornment = styled(InputAdornment)(({ theme }) => ({
  flexDirection: "column",
  maxHeight: "unset",
  alignSelf: "stretch",
  borderLeft: "1px solid",
  borderColor: theme.palette.divider,
  marginLeft: 0,

  "& button": {
    paddingTop: 0,
    paddingBottom: 0,
    flex: 1,
    borderRadius: `calc(${theme.vars.shape.borderRadius} / 2)`,
  },
}));

const StyledOutlinedInput = styled(OutlinedInput)({
  paddingRight: 0,
});

const StyledFormHelperText = styled(FormHelperText)({
  marginLeft: 0,
});

const StyledKeyboardArrowUp = styled(KeyboardArrowUp)({
  transform: "translateY(2px)",
});

const StyledKeyboardArrowDown = styled(KeyboardArrowDown)({
  transform: "translateY(-2px)",
});

// This component is a placeholder for FormControl to correctly set the shrink label state on SSR.
const SSRInitialFilled = () => null;
SSRInitialFilled.muiName = "Input";

interface NumberFieldProps extends BaseNumberField.Root.Props {
  className?: string;
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  label?: React.ReactNode;
  placeholder?: string;
  size?: "small" | "medium";
}

const NumberField = ({
  className,
  error,
  fullWidth,
  helperText,
  id: idProp,
  label,
  placeholder,
  size = "medium",
  ...other
}: NumberFieldProps) => {
  let id = useId();
  if (idProp) id = idProp;

  return (
    <BaseNumberField.Root
      {...other}
      render={(props, state) => (
        <FormControl
          className={className}
          disabled={state.disabled}
          error={error}
          fullWidth={fullWidth}
          ref={props.ref}
          required={state.required}
          size={size}
          variant="outlined"
        >
          {props.children}
        </FormControl>
      )}
    >
      <SSRInitialFilled {...other} />
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <BaseNumberField.Input
        id={id}
        render={(props, state) => (
          <StyledOutlinedInput
            aria-describedby={helperText ? `${id}-helper-text` : undefined}
            endAdornment={
              <StyledInputAdornment position="end">
                <BaseNumberField.Increment
                  render={<IconButton aria-label="Increase" size={size} />}
                >
                  <StyledKeyboardArrowUp fontSize={size} />
                </BaseNumberField.Increment>
                <BaseNumberField.Decrement
                  render={<IconButton aria-label="Decrease" size={size} />}
                >
                  <StyledKeyboardArrowDown fontSize={size} />
                </BaseNumberField.Decrement>
              </StyledInputAdornment>
            }
            inputRef={props.ref}
            label={label}
            onBlur={props.onBlur}
            onChange={props.onChange}
            onFocus={props.onFocus}
            onKeyDown={props.onKeyDown}
            onKeyUp={props.onKeyUp}
            placeholder={placeholder}
            slotProps={{ input: props }}
            value={state.inputValue}
          />
        )}
      />
      {helperText && (
        <StyledFormHelperText id={`${id}-helper-text`}>
          {helperText}
        </StyledFormHelperText>
      )}
    </BaseNumberField.Root>
  );
};

export default NumberField;
