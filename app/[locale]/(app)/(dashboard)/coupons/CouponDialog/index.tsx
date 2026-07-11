"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import { type CouponFormValues, useCouponFormSchema } from "../definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Autocomplete,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";

import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import {
  couponResponseDtoDiscountTypeValues,
  couponResponseDtoScopeValues,
} from "@/types/api";
import type { Coupon, CreateCouponDto } from "@/types/coupons";
import type { OrderMenu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const issueTriggerOptions: CouponFormValues["issueTrigger"][] = [
  "none",
  "signup",
  "birthday",
  "spend",
];

const toDateTimeLocal = (value: string | null | undefined): string =>
  value ? dayjs(value).format("YYYY-MM-DDTHH:mm") : "";

interface CouponDialogProps {
  coupon: Coupon | null;
  menu: OrderMenu | null;
  mutate: () => void;
  organizationSlug: string;
}

const CouponDialog = ({
  coupon,
  menu,
  mutate,
  organizationSlug,
}: CouponDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tCoupons = useTranslations("coupons");

  const couponFormSchema = useCouponFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<CouponFormValues>({
    defaultValues: {
      code: coupon?.code || "",
      discountType: coupon?.discountType || "fixed",
      discountValue: coupon ? String(Number(coupon.discountValue)) : "",
      isActive: coupon?.isActive ?? true,
      isClaimable: coupon?.isClaimable ?? false,
      isPublic: coupon?.isPublic ?? false,
      issueMinSpend: coupon?.issueMinSpend
        ? String(Number(coupon.issueMinSpend))
        : "",
      issueTrigger: coupon?.issueTrigger || "none",
      menuItemIds: coupon?.menuItemIds || [],
      menuSectionIds: coupon?.menuSectionIds || [],
      minSubtotal: coupon?.minSubtotal
        ? String(Number(coupon.minSubtotal))
        : "",
      perUserLimit:
        coupon?.perUserLimit != null ? String(coupon.perUserLimit) : "",
      scope: coupon?.scope || "order",
      totalLimit: coupon?.totalLimit != null ? String(coupon.totalLimit) : "",
      validFrom: toDateTimeLocal(coupon?.validFrom),
      validUntil: toDateTimeLocal(coupon?.validUntil),
    },
    resolver: zodResolver(couponFormSchema),
  });

  const [
    discountType,
    discountValue,
    isActive,
    isClaimable,
    isPublic,
    issueMinSpend,
    issueTrigger,
    menuItemIds,
    menuSectionIds,
    minSubtotal,
    perUserLimit,
    scope,
    totalLimit,
    validFrom,
    validUntil,
  ] = useWatch({
    control,
    name: [
      "discountType",
      "discountValue",
      "isActive",
      "isClaimable",
      "isPublic",
      "issueMinSpend",
      "issueTrigger",
      "menuItemIds",
      "menuSectionIds",
      "minSubtotal",
      "perUserLimit",
      "scope",
      "totalLimit",
      "validFrom",
      "validUntil",
    ],
  });

  const sectionOptions = menu?.sections || [];
  const itemOptions = sectionOptions.flatMap(({ menuItems }) => menuItems);
  const currency = itemOptions[0]?.offers[0]?.priceCurrency || "";

  const onSubmitHandler = async (values: CouponFormValues) => {
    try {
      setDialog({ confirmLoading: true });

      const body: CreateCouponDto = {
        code: values.code,
        ...(currency && { discountCurrency: currency }),
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        isActive: values.isActive,
        isClaimable: values.isClaimable,
        isPublic: values.isPublic,
        ...(values.issueTrigger === "spend" && {
          issueMinSpend: Number(values.issueMinSpend),
        }),
        issueTrigger:
          values.issueTrigger === "none" ? null : values.issueTrigger,
        ...(values.scope === "item" && {
          menuItemIds: values.menuItemIds,
          menuSectionIds: values.menuSectionIds,
        }),
        ...(values.minSubtotal && { minSubtotal: Number(values.minSubtotal) }),
        ...(values.perUserLimit && {
          perUserLimit: Number(values.perUserLimit),
        }),
        scope: values.scope,
        ...(values.totalLimit && { totalLimit: Number(values.totalLimit) }),
        ...(values.validFrom && {
          validFrom: new Date(values.validFrom).toISOString(),
        }),
        ...(values.validUntil && {
          validUntil: new Date(values.validUntil).toISOString(),
        }),
      };

      await fetcher(
        coupon
          ? `/api/organizations/${organizationSlug}/coupons/${coupon.id}`
          : `/api/organizations/${organizationSlug}/coupons`,
        {
          method: coupon ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      enqueueSnackbar(
        tCoupons(
          coupon
            ? "actions.updateCoupon.success"
            : "actions.createCoupon.success",
          { code: values.code },
        ),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(
        tCoupons(
          coupon ? "actions.updateCoupon.error" : "actions.createCoupon.error",
        ),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="coupon-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.code}
        fullWidth
        helperText={errors.code?.message}
        label={tCoupons("code.label")}
        placeholder={tCoupons("code.placeholder")}
        required
        {...register("code")}
      />
      <TextField
        fullWidth
        label={tCoupons("scope.label")}
        onChange={(e) =>
          setValue("scope", e.target.value as CouponFormValues["scope"], {
            shouldValidate: isSubmitted,
          })
        }
        required
        select
        value={scope}
      >
        {couponResponseDtoScopeValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tCoupons(`scope.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      {scope === "item" && (
        <>
          <Autocomplete
            fullWidth
            getOptionLabel={({ name }) => name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            multiple
            onChange={(_, value) =>
              setValue(
                "menuSectionIds",
                value.map(({ id }) => id),
                { shouldValidate: isSubmitted },
              )
            }
            options={sectionOptions}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!!errors.menuSectionIds}
                helperText={tCoupons("scope.itemHint")}
                label={tCoupons("menuSectionIds.label")}
                placeholder={tCoupons("menuSectionIds.placeholder")}
              />
            )}
            value={sectionOptions.filter(({ id }) =>
              menuSectionIds.includes(id),
            )}
          />
          <Autocomplete
            fullWidth
            getOptionLabel={({ name }) => name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            multiple
            onChange={(_, value) =>
              setValue(
                "menuItemIds",
                value.map(({ id }) => id),
                { shouldValidate: isSubmitted },
              )
            }
            options={itemOptions}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!!errors.menuItemIds}
                helperText={tCoupons("scope.itemHint")}
                label={tCoupons("menuItemIds.label")}
                placeholder={tCoupons("menuItemIds.placeholder")}
              />
            )}
            value={itemOptions.filter(({ id }) => menuItemIds.includes(id))}
          />
        </>
      )}
      <Grid container spacing={2} width="100%">
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label={tCoupons("discountType.label")}
            onChange={(e) =>
              setValue(
                "discountType",
                e.target.value as CouponFormValues["discountType"],
                { shouldValidate: isSubmitted },
              )
            }
            required
            select
            value={discountType}
          >
            {couponResponseDtoDiscountTypeValues.map((type) => (
              <MenuItem key={type} value={type}>
                {tCoupons(`discountType.${type}`)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumericFormat
            allowNegative={false}
            customInput={TextField}
            decimalScale={2}
            error={!!errors.discountValue}
            fullWidth
            helperText={errors.discountValue?.message}
            isAllowed={({ floatValue }) =>
              floatValue === undefined || floatValue <= 99999999.99
            }
            label={tCoupons("discountValue.label")}
            name="discountValue"
            onValueChange={({ value }) =>
              setValue("discountValue", value, { shouldValidate: isSubmitted })
            }
            placeholder={tCoupons("discountValue.placeholder")}
            required
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {discountType === "percentage" ? "%" : currency}
                  </InputAdornment>
                ),
              },
            }}
            thousandSeparator=","
            value={discountValue}
            valueIsNumericString
          />
        </Grid>
      </Grid>
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={2}
        error={!!errors.minSubtotal}
        fullWidth
        helperText={errors.minSubtotal?.message}
        isAllowed={({ floatValue }) =>
          floatValue === undefined || floatValue <= 99999999.99
        }
        label={`${tCoupons("minSubtotal.label")} ${tCommon("optional")}`}
        name="minSubtotal"
        onValueChange={({ value }) =>
          setValue("minSubtotal", value, { shouldValidate: isSubmitted })
        }
        placeholder={tCoupons("minSubtotal.placeholder")}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">{currency}</InputAdornment>
            ),
          },
        }}
        thousandSeparator=","
        value={minSubtotal}
        valueIsNumericString
      />
      <Grid container spacing={2} width="100%">
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.totalLimit}
            fullWidth
            helperText={errors.totalLimit?.message}
            label={`${tCoupons("totalLimit.label")} ${tCommon("optional")}`}
            min={1}
            onValueChange={(value) =>
              setValue("totalLimit", value != null ? String(value) : "", {
                shouldValidate: isSubmitted,
              })
            }
            placeholder={tCoupons("totalLimit.placeholder")}
            value={totalLimit !== "" ? Number(totalLimit) : null}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.perUserLimit}
            fullWidth
            helperText={tCoupons("perUserLimit.hint")}
            label={`${tCoupons("perUserLimit.label")} ${tCommon("optional")}`}
            min={1}
            onValueChange={(value) =>
              setValue("perUserLimit", value != null ? String(value) : "", {
                shouldValidate: isSubmitted,
              })
            }
            placeholder={tCoupons("perUserLimit.placeholder")}
            value={perUserLimit !== "" ? Number(perUserLimit) : null}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} width="100%">
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={`${tCoupons("validFrom.label")} ${tCommon("optional")}`}
            maxDateTime={validUntil ? dayjs(validUntil) : undefined}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.validFrom,
                fullWidth: true,
                helperText: errors.validFrom?.message,
              },
            }}
            value={validFrom ? dayjs(validFrom) : null}
            {...register("validFrom")}
            onChange={(date) =>
              setValue(
                "validFrom",
                date ? date.format("YYYY-MM-DDTHH:mm") : "",
                {
                  shouldValidate: isSubmitted,
                },
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={`${tCoupons("validUntil.label")} ${tCommon("optional")}`}
            minDateTime={validFrom ? dayjs(validFrom) : undefined}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.validUntil,
                fullWidth: true,
                helperText: errors.validUntil?.message,
              },
            }}
            value={validUntil ? dayjs(validUntil) : null}
            {...register("validUntil")}
            onChange={(date) =>
              setValue(
                "validUntil",
                date ? date.format("YYYY-MM-DDTHH:mm") : "",
                {
                  shouldValidate: isSubmitted,
                },
              )
            }
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} width="100%">
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            helperText={tCoupons(`issueTrigger.hint.${issueTrigger}`)}
            label={tCoupons("issueTrigger.label")}
            onChange={(e) =>
              setValue(
                "issueTrigger",
                e.target.value as CouponFormValues["issueTrigger"],
                { shouldValidate: isSubmitted },
              )
            }
            select
            value={issueTrigger}
          >
            {issueTriggerOptions.map((value) => (
              <MenuItem key={value} value={value}>
                {tCoupons(`issueTrigger.${value}`)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        {issueTrigger === "spend" && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <NumericFormat
              allowNegative={false}
              customInput={TextField}
              decimalScale={2}
              error={!!errors.issueMinSpend}
              fullWidth
              helperText={errors.issueMinSpend?.message}
              isAllowed={({ floatValue }) =>
                floatValue === undefined || floatValue <= 99999999.99
              }
              label={tCoupons("issueMinSpend.label")}
              name="issueMinSpend"
              onValueChange={({ value }) =>
                setValue("issueMinSpend", value, {
                  shouldValidate: isSubmitted,
                })
              }
              placeholder={tCoupons("issueMinSpend.placeholder")}
              required
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">{currency}</InputAdornment>
                  ),
                },
              }}
              thousandSeparator=","
              value={issueMinSpend}
              valueIsNumericString
            />
          </Grid>
        )}
      </Grid>
      <FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={(_, checked) => setValue("isActive", checked)}
            />
          }
          label={tCoupons("isActive.label")}
          sx={{ alignSelf: "flex-start" }}
        />
        <FormHelperText>{tCoupons("isActive.helperText")}</FormHelperText>
      </FormControl>
      <FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={isClaimable}
              onChange={(_, checked) => setValue("isClaimable", checked)}
            />
          }
          label={tCoupons("isClaimable.label")}
          sx={{ alignSelf: "flex-start" }}
        />
        <FormHelperText>{tCoupons("isClaimable.helperText")}</FormHelperText>
      </FormControl>
      <FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={isPublic}
              onChange={(_, checked) => setValue("isPublic", checked)}
            />
          }
          label={tCoupons("isPublic.label")}
          sx={{ alignSelf: "flex-start" }}
        />
        <FormHelperText>{tCoupons("isPublic.helperText")}</FormHelperText>
      </FormControl>
    </FormBox>
  );
};

export default CouponDialog;
