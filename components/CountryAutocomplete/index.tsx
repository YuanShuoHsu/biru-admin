"use client";

// https://mui.com/material-ui/react-autocomplete/#AutocompleteHint.tsx
// https://mui.com/material-ui/react-autocomplete/#CountrySelect.tsx
// https://mui.com/material-ui/react-autocomplete/#Filter.tsx
// https://mui.com/material-ui/react-autocomplete/#GloballyCustomizedOptions.tsx
// https://mui.com/material-ui/react-autocomplete/#Highlights.tsx
// https://mui.com/material-ui/react-autocomplete/#RenderGroup.tsx

import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import React, { useRef, useState } from "react";

import FlagImage from "@/components/FlagImage";

import { countries } from "@/constants/countries";
import { currencies } from "@/constants/currencies";

import {
  Autocomplete,
  Box,
  type BoxProps,
  createFilterOptions,
  InputAdornment,
  TextField,
  type TextFieldProps,
  Typography,
  TypographyProps,
} from "@mui/material";
import { darken, lighten, styled } from "@mui/material/styles";

import type { CountryType } from "@/types/countries";
import type { CurrencyType } from "@/types/currencies";

import { formatPhone } from "@/utils/countries";

const GroupHeader = styled("div")(({ theme }) => ({
  position: "sticky",
  top: theme.spacing(-1),
  padding: theme.spacing(0.5, 1.25),
  color: theme.palette.primary.main,
  backgroundColor: lighten(theme.palette.primary.light, 0.85),
  zIndex: 1,

  ...theme.applyStyles("dark", {
    backgroundColor: darken(theme.palette.primary.main, 0.8),
  }),
}));

const GroupItems = styled("ul")({
  padding: 0,
});

const InputBox = styled(Box)({
  position: "relative",
});

const HintTypography = styled(Typography)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(2),
  left: theme.spacing(1.75),
  width: "calc(100% - 75px)",
  opacity: 0.5,
  overflow: "hidden",
  whiteSpace: "nowrap",
  pointerEvents: "none",
  zIndex: 1,
}));

const StyledInputAdornment = styled(InputAdornment)(({ theme }) => ({
  position: "relative",
  marginInline: theme.spacing(0.625),
  width: theme.spacing(2.5),
}));

type CountryOptionProps = Omit<BoxProps<"li">, "component"> & {
  selected: boolean;
};

const CountryOptionBox = React.forwardRef<HTMLLIElement, CountryOptionProps>(
  (props, ref) => <Box component="li" ref={ref} {...props} />,
);

CountryOptionBox.displayName = "CountryOptionBox";

const CountryOption = styled(CountryOptionBox, {
  shouldForwardProp: (prop) => prop !== "selected",
})<CountryOptionProps>(({ selected, theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  backgroundColor: selected
    ? theme.vars.palette.action.selected
    : "transparent",
}));

const HighlightTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "highlight",
})<TypographyProps<"span"> & { highlight: boolean }>(
  ({ highlight, theme }) => ({
    fontWeight: highlight
      ? theme.typography.fontWeightBold
      : theme.typography.fontWeightRegular,
  }),
);

const getCountryLabel = ({ label, code, phone }: CountryType) =>
  `${label} (${code}) ${formatPhone(phone)}`;

const getCurrencyLabel = ({ currency, label }: CurrencyType) =>
  `${label} (${currency})`;

const getOptionLabel = (option: CountryType | CurrencyType): string =>
  "currency" in option ? getCurrencyLabel(option) : getCountryLabel(option);

const filter = createFilterOptions<CountryType | CurrencyType>({
  // matchFrom: "start",
  stringify: getOptionLabel,
});

interface CountryAutocompleteProps
  extends Omit<TextFieldProps, "onBlur" | "onChange"> {
  mode: "country" | "currency";
  onBlur?: React.FocusEventHandler;
  onChange?: (event: { target: { name: string; value: string } }) => void;
}

const CountryAutocomplete = ({
  mode,
  name,
  onBlur,
  onChange,
  value: valueCode,
  ...textFieldProps
}: CountryAutocompleteProps) => {
  const isCurrency = mode === "currency";
  const options = isCurrency
    ? [...currencies].sort((a, b) => a.label[0].localeCompare(b.label[0]))
    : [...countries].sort((a, b) => a.label[0].localeCompare(b.label[0]));
  const value = isCurrency
    ? currencies.find(({ currency }) => currency === valueCode) || null
    : countries.find(({ code }) => code === valueCode) || null;

  const currentInputValue = value ? getOptionLabel(value) : "";
  const [inputValue, setInputValue] = useState(currentInputValue);

  const hint = useRef("");

  return (
    <Autocomplete
      autoHighlight
      disablePortal
      filterOptions={(options, params) => {
        if (params.inputValue === currentInputValue) return options;

        return filter(options, params);
      }}
      fullWidth
      getOptionLabel={getOptionLabel}
      groupBy={({ label }) =>
        /[0-9]/.test(label[0]) ? "0-9" : label[0].toUpperCase()
      }
      id={isCurrency ? "currency-autocomplete" : "country-autocomplete"}
      inputValue={inputValue}
      isOptionEqualToValue={(option, selected) =>
        "currency" in option && "currency" in selected
          ? option.currency === selected.currency
          : option.code === selected.code
      }
      onBlur={onBlur}
      onChange={(_, newValue) => {
        setInputValue(newValue ? getOptionLabel(newValue) : "");

        const value = newValue
          ? "currency" in newValue
            ? newValue.currency
            : newValue.code
          : "";
        onChange?.({ target: { name: name || "", value } });
      }}
      onClose={() => {
        hint.current = "";
      }}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === "reset") return;
        if (reason === "blur") {
          setInputValue(currentInputValue);

          return;
        }

        setInputValue(newInputValue);
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab" && hint.current) {
          event.preventDefault();

          setInputValue(hint.current);
        }
      }}
      options={options}
      renderGroup={({ children, group, key }) => (
        <Box component="li" key={key}>
          <GroupHeader>{group}</GroupHeader>
          <GroupItems>{children}</GroupItems>
        </Box>
      )}
      renderInput={(params) => (
        <InputBox>
          <HintTypography>{hint.current}</HintTypography>
          <TextField
            {...params}
            {...textFieldProps}
            onChange={({ target: { value: newValue } }) => {
              const matchingOption = options.find((option) =>
                getOptionLabel(option).startsWith(newValue),
              );

              hint.current =
                newValue && matchingOption
                  ? getOptionLabel(matchingOption)
                  : "";
            }}
            slotProps={{
              htmlInput: {
                ...params.inputProps,
                autoComplete: "new-password",
              },
              input: {
                ...params.InputProps,
                startAdornment: value && (
                  <StyledInputAdornment position="start">
                    <FlagImage code={value.code} label={value.label} />
                  </StyledInputAdornment>
                ),
              },
            }}
          />
        </InputBox>
      )}
      renderOption={(
        { key, ...optionProps },
        option,
        { inputValue, selected },
        ownerState,
      ) => {
        const { code, label } = option;
        const optionLabelText = ownerState.getOptionLabel(option);
        const searchValue = inputValue === currentInputValue ? "" : inputValue;
        const matches = match(optionLabelText, searchValue, {
          findAllOccurrences: true,
          insideWords: true,
        });
        const parts = parse(optionLabelText, matches);

        return (
          <CountryOption key={key} selected={selected} {...optionProps}>
            <FlagImage code={code} label={label} />
            <Box component="div">
              {parts.map(({ highlight, text }, index) => (
                <HighlightTypography
                  component="span"
                  highlight={highlight}
                  key={index}
                >
                  {text}
                </HighlightTypography>
              ))}
            </Box>
          </CountryOption>
        );
      }}
      value={value}
    />
  );
};

export default CountryAutocomplete;
