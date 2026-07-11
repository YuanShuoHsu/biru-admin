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
import useSWR from "swr";

import {
  Autocomplete,
  Box,
  type BoxProps,
  createFilterOptions,
  TextField,
  type TextFieldProps,
  Typography,
  type TypographyProps,
} from "@mui/material";
import { darken, lighten, styled } from "@mui/material/styles";

import type { DonateCodeType } from "@/types/donateCodes";

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

type DonateCodeOptionProps = Omit<BoxProps<"li">, "component"> & {
  selected: boolean;
};

const DonateCodeOptionBox = React.forwardRef<
  HTMLLIElement,
  DonateCodeOptionProps
>((props, ref) => <Box component="li" ref={ref} {...props} />);

DonateCodeOptionBox.displayName = "DonateCodeOptionBox";

const DonateCodeOption = styled(DonateCodeOptionBox, {
  shouldForwardProp: (prop) => prop !== "selected",
})<DonateCodeOptionProps>(({ selected, theme }) => ({
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

const getOptionLabel = ({
  donateNm,
  donateCode,
  donateShortNm,
}: DonateCodeType): string =>
  `${donateNm}${donateShortNm ? ` (${donateShortNm})` : ""} ${donateCode}`;

const filter = createFilterOptions<DonateCodeType>({
  stringify: getOptionLabel,
});

interface DonateCodeAutocompleteProps
  extends Omit<TextFieldProps, "onBlur" | "onChange"> {
  onBlur?: React.FocusEventHandler;
  onChange?: (event: { target: { name: string; value: string } }) => void;
}

const DonateCodeAutocomplete = ({
  name,
  onBlur,
  onChange,
  value: donateCode,
  ...textFieldProps
}: DonateCodeAutocompleteProps) => {
  const { data = [] } = useSWR<DonateCodeType[]>("/api/donate-codes");
  const options = [...data].sort((a, b) =>
    a.donateNm.localeCompare(b.donateNm),
  );
  const value =
    options.find((option) => option.donateCode === donateCode) || null;

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
      groupBy={(option) => option.donateNm[0].toUpperCase()}
      id="donate-code-autocomplete"
      inputValue={inputValue}
      isOptionEqualToValue={(option, selected) =>
        option.donateCode === selected.donateCode
      }
      onBlur={onBlur}
      onChange={(_, newValue) => {
        setInputValue(newValue ? getOptionLabel(newValue) : "");

        const value = newValue?.donateCode || "";
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
        const optionLabelText = ownerState.getOptionLabel(option);
        const searchValue = inputValue === currentInputValue ? "" : inputValue;
        const matches = match(optionLabelText, searchValue, {
          findAllOccurrences: true,
          insideWords: true,
        });
        const parts = parse(optionLabelText, matches);

        return (
          <DonateCodeOption key={key} selected={selected} {...optionProps}>
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
          </DonateCodeOption>
        );
      }}
      value={value}
    />
  );
};

export default DonateCodeAutocomplete;
