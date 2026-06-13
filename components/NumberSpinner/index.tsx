// https://mui.com/material-ui/react-number-field/#SpinnerDemo.tsx

import { useId } from "react";

import { NumberField as BaseNumberField } from "@base-ui/react/number-field";

import { Add, Clear, OpenInFull, Remove } from "@mui/icons-material";
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  OutlinedInput,
  Stack,
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

    // BUG(base-ui): 按下時換 icon 觸發 mouseover，會多減/多加一次
    "& svg": {
      pointerEvents: "none",
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

const ClearButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "visible",
})<{ visible: boolean }>(({ visible }) => ({
  visibility: visible ? "visible" : "hidden",
}));

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

const StyledOutlinedInput = styled(OutlinedInput)({
  paddingRight: 0,
  borderRadius: 0,
  flex: 1,

  "& input": {
    textAlign: "center",
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

interface NumberSpinnerProps extends BaseNumberField.Root.Props {
  className?: string;
  clearable?: boolean;
  decrementAriaLabel?: string;
  decrementIcon?: React.ReactNode;
  error?: boolean;
  fullWidth?: boolean;
  helperText?: string;
  label?: React.ReactNode;
  placeholder?: string;
  size?: "small" | "medium";
}

const NumberSpinner = ({
  className,
  clearable,
  decrementAriaLabel = "Decrease",
  decrementIcon,
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
        </StyledFormControl>
      )}
    >
      {(label || clearable) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <BaseNumberField.ScrubArea render={<ScrubAreaSpan />}>
            <StyledFormLabel htmlFor={id}>{label}</StyledFormLabel>
            <BaseNumberField.ScrubAreaCursor>
              <StyledOpenInFull fontSize="small" />
            </BaseNumberField.ScrubAreaCursor>
          </BaseNumberField.ScrubArea>
          {clearable && (
            <ClearButton
              onClick={() => other.onValueChange?.(null, {} as never)}
              size="small"
              tabIndex={-1}
              visible={other.value != null}
            >
              <Clear fontSize="small" />
            </ClearButton>
          )}
        </Stack>
      )}
      <FlexDiv onClick={(event) => event.stopPropagation()}>
        <BaseNumberField.Decrement
          render={
            <DecrementButton
              aria-label={decrementAriaLabel}
              size={size}
              variant="outlined"
            />
          }
        >
          {decrementIcon || <Remove fontSize={size} />}
        </BaseNumberField.Decrement>
        <BaseNumberField.Input
          id={id}
          render={(props, state) => (
            <StyledOutlinedInput
              inputRef={props.ref}
              onBlur={props.onBlur}
              onChange={props.onChange}
              onFocus={props.onFocus}
              onKeyDown={props.onKeyDown}
              onKeyUp={props.onKeyUp}
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
              value={state.inputValue}
            />
          )}
        />
        <BaseNumberField.Increment
          render={
            <IncrementButton
              aria-label="Increase"
              size={size}
              variant="outlined"
            />
          }
        >
          <Add fontSize={size} />
        </BaseNumberField.Increment>
      </FlexDiv>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </BaseNumberField.Root>
  );
};

export default NumberSpinner;
