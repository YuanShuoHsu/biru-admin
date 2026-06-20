"use client";

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
  Typography,
  TypographyProps,
} from "@mui/material";
import { darken, lighten, styled } from "@mui/material/styles";

import { fetcher } from "@/utils/fetcher";

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

type LoveCodeOptionProps = Omit<BoxProps<"li">, "component"> & {
  selected: boolean;
};

const LoveCodeOptionBox = React.forwardRef<HTMLLIElement, LoveCodeOptionProps>(
  (props, ref) => <Box component="li" ref={ref} {...props} />,
);

LoveCodeOptionBox.displayName = "LoveCodeOptionBox";

const LoveCodeOption = styled(LoveCodeOptionBox, {
  shouldForwardProp: (prop) => prop !== "selected",
})<LoveCodeOptionProps>(({ selected, theme }) => ({
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

type LoveCodeType = {
  label: string;
  loveCode: string;
  short?: string;
};

const getLoveCodeLabel = ({ label, loveCode, short }: LoveCodeType): string =>
  `${label}${short ? ` (${short})` : ""} ${loveCode}`;

const filter = createFilterOptions<LoveCodeType>({
  stringify: getLoveCodeLabel,
});

interface LoveCodeSelectProps {
  error: boolean;
  helperText: React.ReactNode;
  label: string;
  name?: string;
  onBlur?: React.FocusEventHandler;
  onChange?: (event: { target: { name: string; value: string } }) => void;
  required?: boolean;
  value: string;
}

const LoveCodeSelect = ({
  error,
  helperText,
  label,
  name,
  onBlur,
  onChange,
  required,
  value: loveCode,
}: LoveCodeSelectProps) => {
  const { data = [] } = useSWR<LoveCodeType[]>("/api/love-codes", fetcher);
  const options = [...data].sort((a, b) => a.label.localeCompare(b.label));
  const value = options.find((opt) => opt.loveCode === loveCode) || null;

  const currentInputValue = value ? getLoveCodeLabel(value) : "";
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
      getOptionLabel={getLoveCodeLabel}
      groupBy={(option) => option.label[0].toUpperCase()}
      id="love-code-select"
      inputValue={inputValue}
      isOptionEqualToValue={(option, selected) =>
        selected ? option.loveCode === selected.loveCode : false
      }
      onBlur={onBlur}
      onChange={(_, newValue) => {
        setInputValue(newValue ? getLoveCodeLabel(newValue) : "");

        const value = newValue?.loveCode || "";
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
            error={error}
            helperText={helperText}
            label={label}
            onChange={({ target: { value: newValue } }) => {
              const matchingOption = options.find((option) =>
                getLoveCodeLabel(option).startsWith(newValue),
              );

              hint.current =
                newValue && matchingOption
                  ? getLoveCodeLabel(matchingOption)
                  : "";
            }}
            required={required}
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
          <LoveCodeOption key={key} selected={selected} {...optionProps}>
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
          </LoveCodeOption>
        );
      }}
      value={value}
    />
  );
};

export default LoveCodeSelect;
