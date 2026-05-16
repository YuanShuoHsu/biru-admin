import { useId } from "react";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";

import { Add, OpenInFull, Remove } from "@mui/icons-material";
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  OutlinedInput,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiButton-root": {
    borderColor: theme.palette.divider,
    minWidth: 0,
    backgroundColor: theme.palette.action.hover,
    "&:not(.Mui-disabled)": {
      color: theme.palette.text.primary,
    },
  },
}));

const ScrubAreaSpan = styled("span")({
  userSelect: "none",
  width: "max-content",
});

const StyledFormLabel = styled(FormLabel)(({ theme }) => ({
  display: "inline-block",
  cursor: "ew-resize",
  fontSize: "0.875rem",
  color: theme.palette.text.primary,
  fontWeight: 500,
  lineHeight: 1.5,
  marginBottom: theme.spacing(0.5),
}));

const StyledOpenInFull = styled(OpenInFull)({
  transform: "translateY(12.5%) rotate(45deg)",
});

const FlexDiv = styled("div")({
  display: "flex",
});

const DecrementButton = styled(Button)({
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  borderRight: "0px",
  "&.Mui-disabled": {
    borderRight: "0px",
  },
});

const IncrementButton = styled(Button)({
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderLeft: "0px",
  "&.Mui-disabled": {
    borderLeft: "0px",
  },
});

const StyledOutlinedInput = styled(OutlinedInput)({
  paddingRight: 0,
  borderRadius: 0,
  flex: 1,
  "& input": {
    textAlign: "center",
  },
});

interface NumberSpinnerProps extends BaseNumberField.Root.Props {
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  label?: React.ReactNode;
  placeholder?: string;
  size?: "small" | "medium";
}

const NumberSpinner = ({
  error,
  fullWidth,
  helperText,
  id: idProp,
  label,
  placeholder,
  size = "medium",
  ...other
}: NumberSpinnerProps) => {
  let id = useId();
  if (idProp) id = idProp;

  return (
    <BaseNumberField.Root
      {...other}
      render={(props, state) => (
        <StyledFormControl
          size={size}
          fullWidth={fullWidth}
          ref={props.ref}
          disabled={state.disabled}
          required={state.required}
          error={error}
          variant="outlined"
        >
          {props.children}
        </StyledFormControl>
      )}
    >
      <BaseNumberField.ScrubArea render={<ScrubAreaSpan />}>
        <StyledFormLabel htmlFor={id}>{label}</StyledFormLabel>
        <BaseNumberField.ScrubAreaCursor>
          <StyledOpenInFull fontSize="small" />
        </BaseNumberField.ScrubAreaCursor>
      </BaseNumberField.ScrubArea>
      <FlexDiv>
        <BaseNumberField.Decrement
          render={
            <DecrementButton
              variant="outlined"
              aria-label="Decrease"
              size={size}
            />
          }
        >
          <Remove fontSize={size} />
        </BaseNumberField.Decrement>

        <BaseNumberField.Input
          id={id}
          render={(props, state) => (
            <StyledOutlinedInput
              inputRef={props.ref}
              value={state.inputValue}
              onBlur={props.onBlur}
              onChange={props.onChange}
              onKeyUp={props.onKeyUp}
              onKeyDown={props.onKeyDown}
              onFocus={props.onFocus}
              placeholder={placeholder}
              slotProps={{
                input: {
                  ...props,
                  size:
                    Math.max(
                      (other.min?.toString() || "").length,
                      state.inputValue.length || 1,
                    ) + 1,
                },
              }}
            />
          )}
        />

        <BaseNumberField.Increment
          render={
            <IncrementButton
              variant="outlined"
              aria-label="Increase"
              size={size}
            />
          }
        >
          <Add fontSize={size} />
        </BaseNumberField.Increment>
      </FlexDiv>
      <FormHelperText>{helperText}</FormHelperText>
    </BaseNumberField.Root>
  );
};

export default NumberSpinner;
