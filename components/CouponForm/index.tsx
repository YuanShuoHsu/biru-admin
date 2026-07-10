"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { LocalOffer } from "@mui/icons-material";
import {
  Autocomplete,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import useCartTotals from "@/hooks/useCartTotals";

import type {
  AvailableCoupon,
  ValidateCouponDto,
  ValidateCouponResponse,
} from "@/types/coupons";

import { getErrorMessage } from "@/utils/errors";
import { sendRequest } from "@/utils/fetcher";

interface CouponFormProps {
  coupon: ValidateCouponResponse | null;
  items: ValidateCouponDto["items"];
  onChange: (
    event: React.SyntheticEvent,
    value: ValidateCouponResponse | null,
  ) => void;
}

const CouponForm = ({ coupon, items, onChange }: CouponFormProps) => {
  const { cartCurrency } = useCartTotals();

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const locale = useLocale();

  const { organizationSlug } = useParams();

  const tOrder = useTranslations("order");

  const { data: availableCoupons = [] } = useSWR<AvailableCoupon[]>(
    `/api/organizations/${String(organizationSlug)}/coupons/available`,
  );

  const { isMutating, trigger } = useSWRMutation(
    `/api/organizations/${String(organizationSlug)}/coupons/validate`,
    sendRequest<ValidateCouponResponse, ValidateCouponDto>(),
  );

  const handleApply = async (
    event: React.SyntheticEvent,
    applyCode: string,
  ) => {
    try {
      const result = await trigger({ code: applyCode, items });

      setErrorMessage("");
      onChange(event, result);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const handleRemove = (event: React.SyntheticEvent) => {
    setCode("");
    setErrorMessage("");
    onChange(event, null);
  };

  const selected =
    availableCoupons.find((available) => available.code === coupon?.code) ||
    null;

  return (
    <>
      <Stack alignItems="flex-start" direction="row" gap={1} width="100%">
        <Autocomplete
          freeSolo
          fullWidth
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.code
          }
          inputValue={coupon ? coupon.code : code}
          isOptionEqualToValue={(option, value) => option.code === value.code}
          onChange={(event, value) => {
            if (value && typeof value !== "string")
              void handleApply(event, value.code);
          }}
          onInputChange={(event, value) => {
            setCode(value);
            setErrorMessage("");
          }}
          options={availableCoupons}
          readOnly={!!coupon}
          renderInput={(params) => (
            <TextField
              {...params}
              error={!!errorMessage}
              helperText={errorMessage}
              label={tOrder("checkout.coupon.label")}
              placeholder={tOrder("checkout.coupon.placeholder")}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.userCouponId || option.id}>
              <Stack
                alignItems="center"
                direction="row"
                gap={1}
                justifyContent="space-between"
                width="100%"
              >
                <Stack alignItems="center" direction="row" gap={1}>
                  <LocalOffer color="disabled" fontSize="small" />
                  <Stack>
                    <Stack alignItems="center" direction="row" gap={0.5}>
                      <Typography variant="subtitle2">{option.code}</Typography>
                      {option.userCouponId && (
                        <Chip
                          color="primary"
                          label={tOrder("checkout.coupon.wallet")}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    {option.minSubtotal && (
                      <Typography color="text.secondary" variant="caption">
                        {tOrder("checkout.coupon.minSubtotal", {
                          amount: `${cartCurrency} ${Number(option.minSubtotal).toLocaleString(locale)}`,
                        })}
                      </Typography>
                    )}
                  </Stack>
                </Stack>
                <Typography color="primary" variant="subtitle2">
                  {option.discountType === "percentage"
                    ? `-${Number(option.discountValue)}%`
                    : `-${cartCurrency} ${Number(option.discountValue).toLocaleString(locale)}`}
                </Typography>
              </Stack>
            </li>
          )}
          value={selected}
        />
        <Button
          disabled={!coupon && !code.trim()}
          loading={isMutating}
          onClick={(event) =>
            coupon ? handleRemove(event) : handleApply(event, code)
          }
          sx={{ flexShrink: 0, height: 56 }}
          variant="outlined"
        >
          {tOrder(coupon ? "checkout.coupon.remove" : "checkout.coupon.apply")}
        </Button>
      </Stack>
      {coupon && (
        <>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            width="100%"
          >
            <Stack alignItems="center" direction="row" gap={0.5}>
              <LocalOffer color="primary" fontSize="small" />
              <Typography color="text.secondary" variant="body2">
                {tOrder("checkout.coupon.discount")}
              </Typography>
            </Stack>
            <Typography color="primary" variant="body2">
              -{cartCurrency} {Number(coupon.discount).toLocaleString(locale)}
            </Typography>
          </Stack>
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="space-between"
            width="100%"
          >
            <Typography fontWeight="bold" variant="subtitle2">
              {tOrder("checkout.coupon.total")}
            </Typography>
            <Typography color="primary" fontWeight="bold" variant="subtitle1">
              {cartCurrency} {Number(coupon.total).toLocaleString(locale)}
            </Typography>
          </Stack>
        </>
      )}
    </>
  );
};

export default CouponForm;
