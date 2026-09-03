"use client";

// https://mui.com/material-ui/react-autocomplete/#AutocompleteHint.tsx
// https://mui.com/material-ui/react-autocomplete/#CountrySelect.tsx
// https://mui.com/material-ui/react-autocomplete/#Filter.tsx
// https://mui.com/material-ui/react-autocomplete/#GloballyCustomizedOptions.tsx
// https://mui.com/material-ui/react-autocomplete/#Highlights.tsx
// https://mui.com/material-ui/react-autocomplete/#RenderGroup.tsx

import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React, { useRef, useState } from "react";
import useSWR from "swr";

import useCartTotals from "@/hooks/useCartTotals";

import { CheckCircle, LocalOffer } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  CircularProgress,
  createFilterOptions,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  type TextFieldProps,
  Typography,
  type TypographyProps,
} from "@mui/material";
import { darken, lighten, styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";

import type { AvailableCoupon } from "@/types/coupons";

const StyledAutocomplete = styled(Autocomplete)({
  "& .MuiAutocomplete-clearIndicator": {
    visibility: "visible",
  },
}) as typeof Autocomplete;

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

const HighlightTypography = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "highlight",
})<TypographyProps<"span"> & { highlight: boolean }>(
  ({ highlight, theme }) => ({
    fontWeight: highlight
      ? theme.typography.fontWeightBold
      : theme.typography.fontWeightRegular,
  }),
);

const getOptionKey = (option: AvailableCoupon | string): string =>
  typeof option === "string" ? option : option.userCouponId || option.id;

const getOptionLabel = (option: AvailableCoupon | string): string =>
  typeof option === "string" ? option : option.code;

const filter = createFilterOptions<AvailableCoupon>({
  stringify: getOptionLabel,
});

interface CouponAutocompleteProps
  extends Omit<TextFieldProps, "onBlur" | "onChange"> {
  loading: boolean;
  onBlur?: React.FocusEventHandler;
  onChange?: (event: { target: { name: string; value: string } }) => void;
}

const CouponAutocomplete = ({
  loading,
  name,
  onBlur,
  onChange,
  value: valueCode,
  ...textFieldProps
}: CouponAutocompleteProps) => {
  const couponCode = String(valueCode || "");

  const [code, setCode] = useState("");

  const hint = useRef("");

  const { cartItemsList } = useCartStore((state) => state);

  const { cartCurrency } = useCartTotals();

  const locale = useLocale();

  const { organizationSlug } = useParams();

  const tOrder = useTranslations("order");

  const { data: availableCoupons = [] } = useSWR<AvailableCoupon[]>(
    `/api/organizations/${String(organizationSlug)}/coupons/available`,
  );

  const value =
    availableCoupons.find((available) => available.code === couponCode) || null;

  return (
    <StyledAutocomplete
      autoHighlight
      autoSelect
      disablePortal
      disabled={!cartItemsList.length}
      filterOptions={(options, params) => {
        if (params.inputValue === couponCode) return options;

        return filter(options, params);
      }}
      freeSolo
      fullWidth
      getOptionKey={getOptionKey}
      getOptionLabel={getOptionLabel}
      groupBy={({ userCouponId }) =>
        userCouponId
          ? tOrder("checkout.coupon.wallet")
          : tOrder("checkout.coupon.available")
      }
      id="coupon-autocomplete"
      inputValue={couponCode || code}
      isOptionEqualToValue={(option, selected) => option.code === selected.code}
      onBlur={onBlur}
      onChange={(_, newValue) => {
        if (!newValue) setCode("");

        const value = newValue
          ? typeof newValue === "string"
            ? newValue
            : newValue.code
          : "";
        onChange?.({ target: { name: name || "", value } });
      }}
      onClose={() => {
        hint.current = "";
      }}
      onInputChange={(_, newInputValue, reason) => {
        setCode(newInputValue);

        if (couponCode && (reason === "clear" || reason === "input")) {
          onChange?.({ target: { name: name || "", value: "" } });
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab" && hint.current) {
          event.preventDefault();

          setCode(hint.current);
        }
      }}
      options={availableCoupons}
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
              const matchingOption = availableCoupons.find((option) =>
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
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress size={20} />
                    ) : (
                      !!cartItemsList.length &&
                      !textFieldProps.error &&
                      couponCode && (
                        <Stack direction="row" alignItems="center" gap={1}>
                          {value && (
                            <Typography color="primary" variant="subtitle2">
                              {value.discountType === "percentage"
                                ? `-${Number(value.discountValue)}%`
                                : `-${cartCurrency} ${Number(
                                    value.discountValue,
                                  ).toLocaleString(locale)}`}
                            </Typography>
                          )}
                          <CheckCircle color="success" fontSize="small" />
                        </Stack>
                      )
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        </InputBox>
      )}
      renderOption={(
        { key, ...optionProps },
        option,
        { inputValue },
        ownerState,
      ) => {
        const { discountType, discountValue, minSubtotal } = option;
        const optionLabelText = ownerState.getOptionLabel(option);
        const searchValue = inputValue === couponCode ? "" : inputValue;
        const matches = match(optionLabelText, searchValue, {
          findAllOccurrences: true,
          insideWords: true,
        });
        const parts = parse(optionLabelText, matches);

        return (
          <ListItem key={key} {...optionProps}>
            <ListItemIcon>
              <LocalOffer fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle2">
                  {parts.map(({ highlight, text }, index) => (
                    <HighlightTypography
                      component="span"
                      highlight={highlight}
                      key={index}
                      variant="subtitle2"
                    >
                      {text}
                    </HighlightTypography>
                  ))}
                </Typography>
              }
              secondary={
                minSubtotal &&
                tOrder("checkout.coupon.minSubtotal", {
                  amount: `${cartCurrency} ${Number(minSubtotal).toLocaleString(locale)}`,
                })
              }
            />
            <Typography color="primary" variant="subtitle2">
              {discountType === "percentage"
                ? `-${Number(discountValue)}%`
                : `-${cartCurrency} ${Number(discountValue).toLocaleString(locale)}`}
            </Typography>
          </ListItem>
        );
      }}
      value={value}
    />
  );
};

export default CouponAutocomplete;
