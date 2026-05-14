"use client";

// https://mui.com/material-ui/react-autocomplete/#AutocompleteHint.tsx
// https://mui.com/material-ui/react-autocomplete/#CountrySelect.tsx
// https://mui.com/material-ui/react-autocomplete/#Filter.tsx
// https://mui.com/material-ui/react-autocomplete/#GloballyCustomizedOptions.tsx
// https://mui.com/material-ui/react-autocomplete/#Highlights.tsx
// https://mui.com/material-ui/react-autocomplete/#RenderGroup.tsx

import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import type { CountryCode } from "libphonenumber-js";
import Image from "next/image";
import React, { useRef, useState } from "react";

import { countries } from "@/constants/countries";
import { currencies } from "@/constants/currencies";

import {
  Autocomplete,
  Box,
  createFilterOptions,
  InputAdornment,
  TextField,
  Typography,
  TypographyProps,
  type BoxProps,
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

const FlagImage = ({ code, label }: { code: CountryCode; label: string }) => (
  <Image
    alt={label}
    fill
    loading="lazy"
    sizes="(min-width: 808px) 50vw, 100vw"
    src={`/images/flags/w20/${code.toLowerCase()}.png`}
    style={{ objectFit: "contain" }}
    unoptimized
  />
);

type CountryOptionBoxProps = Omit<BoxProps<"li">, "component"> & {
  selected: boolean;
};

const CountryOptionRoot = React.forwardRef<
  HTMLLIElement,
  CountryOptionBoxProps
>((props, ref) => <Box component="li" ref={ref} {...props} />);

CountryOptionRoot.displayName = "CountryOptionRoot";

const CountryOptionBox = styled(CountryOptionRoot, {
  shouldForwardProp: (prop) => prop !== "selected",
})<CountryOptionBoxProps>(({ selected, theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  backgroundColor: selected
    ? theme.vars.palette.action.selected
    : "transparent",
}));

const ImageBox = styled(Box)(({ theme }) => ({
  position: "relative",
  width: theme.spacing(2.5),
  height: theme.spacing(2.5),
  flexShrink: 0,
  overflow: "hidden",
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

interface CountrySelectProps {
  error: boolean;
  helperText: React.ReactNode;
  label: string;
  mode?: "country" | "currency";
  onChange: (value: CountryType | CurrencyType) => void;
  value: CountryType | CurrencyType;
}

const CountrySelect = ({
  error,
  helperText,
  label,
  mode = "country",
  onChange,
  value,
}: CountrySelectProps) => {
  const currentInputValue =
    "currency" in value ? value.currency : getCountryLabel(value);

  const [inputValue, setInputValue] = useState(currentInputValue);

  const hint = useRef("");

  const isCurrency = mode === "currency";

  const options: (CountryType | CurrencyType)[] = isCurrency
    ? currencies.sort((a, b) => a.label[0].localeCompare(b.label[0]))
    : countries.sort((a, b) => a.label[0].localeCompare(b.label[0]));

  const getOptionLabel = (option: CountryType | CurrencyType): string =>
    "currency" in option ? getCurrencyLabel(option) : getCountryLabel(option);

  const getInputValue = (option: CountryType | CurrencyType): string =>
    "currency" in option ? option.currency : getCountryLabel(option);

  const filter = createFilterOptions<CountryType | CurrencyType>({
    // matchFrom: "start",
    stringify: getOptionLabel,
  });

  return (
    <Autocomplete
      autoHighlight
      disableClearable
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
      id={isCurrency ? "currency-select" : "country-select"}
      inputValue={inputValue}
      isOptionEqualToValue={(option, value) =>
        "currency" in option && "currency" in value
          ? option.currency === value.currency
          : option.code === value.code
      }
      onChange={(_, newValue) => {
        setInputValue(getInputValue(newValue));

        onChange(newValue);
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
      renderGroup={({ key, group, children }) => (
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
            error={error}
            helperText={helperText}
            label={label}
            onChange={({ target: { value: newValue } }) => {
              setInputValue(newValue);

              const matchingOption = options.find((option) =>
                getOptionLabel(option).startsWith(newValue),
              );

              hint.current =
                newValue && matchingOption ? getInputValue(matchingOption) : "";
            }}
            required
            slotProps={{
              htmlInput: {
                ...params.inputProps,
                autoComplete: "new-password",
              },
              input: {
                ...params.InputProps,
                startAdornment: (
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
          <CountryOptionBox key={key} selected={selected} {...optionProps}>
            <ImageBox>
              <FlagImage code={code} label={label} />
            </ImageBox>
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
          </CountryOptionBox>
        );
      }}
      value={value}
    />
  );
};

export default CountrySelect;
