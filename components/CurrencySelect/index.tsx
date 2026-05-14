"use client";

import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import Image from "next/image";
import React, { useRef, useState } from "react";

import { currencies } from "@/constants/currencies";

import {
  Autocomplete,
  Box,
  createFilterOptions,
  InputAdornment,
  TextField,
  Typography,
  type BoxProps,
  type TypographyProps,
} from "@mui/material";
import { darken, lighten, styled } from "@mui/material/styles";

import type { CurrencyType } from "@/types/currencies";

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

const FlagImage = ({ code, label }: { code: string; label: string }) => (
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

type CurrencyOptionBoxProps = Omit<BoxProps<"li">, "component"> & {
  selected: boolean;
};

const CurrencyOptionRoot = React.forwardRef<
  HTMLLIElement,
  CurrencyOptionBoxProps
>((props, ref) => <Box component="li" ref={ref} {...props} />);

CurrencyOptionRoot.displayName = "CurrencyOptionRoot";

const CurrencyOptionBox = styled(CurrencyOptionRoot, {
  shouldForwardProp: (prop) => prop !== "selected",
})<CurrencyOptionBoxProps>(({ selected, theme }) => ({
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

const getCurrencyLabel = ({ currency, label }: CurrencyType) =>
  `${label} (${currency})`;

const filter = createFilterOptions<CurrencyType>({
  // matchFrom: "start",
  stringify: getCurrencyLabel,
});

interface CurrencySelectProps {
  error: boolean;
  helperText: React.ReactNode;
  label: string;
  onChange: (value: CurrencyType) => void;
  value: CurrencyType;
}

const CurrencySelect = ({
  error,
  helperText,
  label,
  onChange,
  value,
}: CurrencySelectProps) => {
  const { code, currency, label: currencyName } = value;

  const [inputValue, setInputValue] = useState(currency);

  const hint = useRef("");

  return (
    <Autocomplete
      autoHighlight
      disableClearable
      disablePortal
      filterOptions={(options, params) => {
        const { inputValue } = params;
        if (inputValue === currency) return options;

        return filter(options, params);
      }}
      fullWidth
      getOptionLabel={getCurrencyLabel}
      isOptionEqualToValue={(
        { currency: optionCurrency },
        { currency: valueCurrency },
      ) => optionCurrency === valueCurrency}
      groupBy={({ currency }) => currency[0].toUpperCase()}
      id="currency-select"
      inputValue={inputValue}
      onChange={(_, newValue: CurrencyType) => {
        setInputValue(newValue.currency);

        onChange(newValue);
      }}
      onClose={() => {
        hint.current = "";
      }}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === "reset") return;
        if (reason === "blur") {
          setInputValue(currency);

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
      options={currencies.sort((a, b) =>
        a.currency[0].localeCompare(b.currency[0]),
      )}
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

              const matchingOption = currencies.find((option) =>
                getCurrencyLabel(option).startsWith(newValue),
              );

              hint.current =
                newValue && matchingOption
                  ? getCurrencyLabel(matchingOption)
                  : "";
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
                    <FlagImage code={code} label={currencyName} />
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
        const searchValue =
          inputValue === getCurrencyLabel(value) ? "" : inputValue;
        const matches = match(optionLabelText, searchValue, {
          findAllOccurrences: true,
          insideWords: true,
        });
        const parts = parse(optionLabelText, matches);

        return (
          <CurrencyOptionBox key={key} selected={selected} {...optionProps}>
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
          </CurrencyOptionBox>
        );
      }}
      value={value}
    />
  );
};

export default CurrencySelect;
