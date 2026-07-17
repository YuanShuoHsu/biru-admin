"use client";

import dayjs from "dayjs";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import useSWR from "swr";

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
import type { OrganizationResponse } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

const issueTriggerOptions: CouponFormValues["issueTrigger"][] = [
  "none",
  "signup",
  "birthday",
  "spend",
];

const organizationScopeOptions: CouponFormValues["organizationScope"][] = [
  "all",
  "specific",
];

const toDateTimeLocal = (value: string | null | undefined): string =>
  value ? dayjs(value).format("YYYY-MM-DDTHH:mm") : "";

interface CouponDialogProps {
  coupon: Coupon | null;
  mutate: () => void;
  organizations: OrganizationResponse[];
}

const CouponDialog = ({ coupon, mutate, organizations }: CouponDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

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
      applicableOrganizationIds: coupon?.applicableOrganizationIds || [],
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
      organizationScope: coupon?.applicableOrganizationIds?.length
        ? "specific"
        : "all",
      perUserLimit:
        coupon?.perUserLimit != null ? String(coupon.perUserLimit) : "",
      pointsCost: coupon?.pointsCost != null ? String(coupon.pointsCost) : "",
      scope: coupon?.scope || "order",
      totalLimit: coupon?.totalLimit != null ? String(coupon.totalLimit) : "",
      validFrom: toDateTimeLocal(coupon?.validFrom),
      validThrough: toDateTimeLocal(coupon?.validThrough),
    },
    resolver: zodResolver(couponFormSchema),
  });

  const [
    applicableOrganizationIds,
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
    organizationScope,
    perUserLimit,
    pointsCost,
    scope,
    totalLimit,
    validFrom,
    validThrough,
  ] = useWatch({
    control,
    name: [
      "applicableOrganizationIds",
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
      "organizationScope",
      "perUserLimit",
      "pointsCost",
      "scope",
      "totalLimit",
      "validFrom",
      "validThrough",
    ],
  });

  // 品項券限定單一店家：菜單依所選店家載入（品項 ID 各店不同）
  const itemOrganizationId =
    scope === "item" ? applicableOrganizationIds[0] || "" : "";
  const { data: menu = null } = useSWR<OrderMenu>(
    itemOrganizationId
      ? `/api/organizations/${itemOrganizationId}/order-menu?lang=${locale}`
      : null,
  );

  const sectionOptions = menu?.sections || [];
  const itemOptions = sectionOptions.flatMap(({ menuItems }) => menuItems);
  const currency = itemOptions[0]?.offers[0]?.priceCurrency || "TWD";

  // 點數兌換券僅能以點數兌換取得，不參與領取／公開／自動發放
  const isPointsRedeem = pointsCost !== "";

  const onSubmitHandler = async (values: CouponFormValues) => {
    try {
      setDialog({ confirmLoading: true });

      const body: CreateCouponDto = {
        // null 表示清除，讓已限定店家的券可改回全部店家通用
        applicableOrganizationIds:
          values.scope === "item" || values.organizationScope === "specific"
            ? values.applicableOrganizationIds
            : null,
        code: values.code,
        discountCurrency: currency,
        discountType: values.discountType,
        discountValue: Number(values.discountValue),
        isActive: values.isActive,
        // 點數兌換券的取得管道旗標由 server 寫入時正規化，client 不重複執行
        isClaimable: values.isClaimable,
        isPublic: values.isPublic,
        ...(values.issueTrigger === "spend" &&
          !values.pointsCost && {
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
        // null 表示清除，讓已設定的券可取消點數兌換
        pointsCost: values.pointsCost ? Number(values.pointsCost) : null,
        scope: values.scope,
        ...(values.totalLimit && { totalLimit: Number(values.totalLimit) }),
        ...(values.validFrom && {
          validFrom: new Date(values.validFrom).toISOString(),
        }),
        ...(values.validThrough && {
          validThrough: new Date(values.validThrough).toISOString(),
        }),
      };

      await fetcher(coupon ? `/api/coupons/${coupon.id}` : "/api/coupons", {
        method: coupon ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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
      {scope === "order" && (
        <>
          <TextField
            fullWidth
            label={tCoupons("organizationScope.label")}
            onChange={(e) =>
              setValue(
                "organizationScope",
                e.target.value as CouponFormValues["organizationScope"],
                { shouldValidate: isSubmitted },
              )
            }
            required
            select
            value={organizationScope}
          >
            {organizationScopeOptions.map((value) => (
              <MenuItem key={value} value={value}>
                {tCoupons(`organizationScope.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          {organizationScope === "specific" && (
            <Autocomplete
              fullWidth
              getOptionLabel={({ name }) => name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              multiple
              onChange={(_, value) =>
                setValue(
                  "applicableOrganizationIds",
                  value.map(({ id }) => id),
                  { shouldValidate: isSubmitted },
                )
              }
              options={organizations}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={!!errors.applicableOrganizationIds}
                  helperText={tCoupons("organizationScope.specificHint")}
                  label={tCoupons("applicableOrganizationIds.label")}
                  placeholder={tCoupons(
                    "applicableOrganizationIds.placeholder",
                  )}
                />
              )}
              value={organizations.filter(({ id }) =>
                applicableOrganizationIds.includes(id),
              )}
            />
          )}
        </>
      )}
      <TextField
        fullWidth
        label={tCoupons("scope.label")}
        onChange={(e) => {
          const value = e.target.value as CouponFormValues["scope"];
          // 品項券限定單一店家：切換適用範圍時重設適用店家
          if (value === "item") setValue("applicableOrganizationIds", []);
          setValue("scope", value, { shouldValidate: isSubmitted });
        }}
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
            onChange={(_, value) => {
              setValue("applicableOrganizationIds", value ? [value.id] : [], {
                shouldValidate: isSubmitted,
              });
              // 品項 ID 各店不同：換店家後清空已選品項
              setValue("menuItemIds", []);
              setValue("menuSectionIds", []);
            }}
            options={organizations}
            renderInput={(params) => (
              <TextField
                {...params}
                error={!!errors.applicableOrganizationIds}
                helperText={
                  errors.applicableOrganizationIds?.message ||
                  tCoupons("applicableOrganizationIds.itemHint")
                }
                label={tCoupons("applicableOrganizationIds.label")}
                placeholder={tCoupons("applicableOrganizationIds.placeholder")}
                required
              />
            )}
            value={
              organizations.find(
                ({ id }) => id === applicableOrganizationIds[0],
              ) || null
            }
          />
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
          <NumberSpinner
            clearable
            error={!!errors.pointsCost}
            fullWidth
            helperText={tCoupons("pointsCost.hint")}
            label={`${tCoupons("pointsCost.label")} ${tCommon("optional")}`}
            min={1}
            onValueChange={(value) =>
              setValue("pointsCost", value != null ? String(value) : "", {
                shouldValidate: isSubmitted,
              })
            }
            placeholder={tCoupons("pointsCost.placeholder")}
            value={pointsCost !== "" ? Number(pointsCost) : null}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} width="100%">
        <Grid size={{ xs: 12, sm: 6 }}>
          <DateTimePicker
            label={`${tCoupons("validFrom.label")} ${tCommon("optional")}`}
            maxDateTime={validThrough ? dayjs(validThrough) : undefined}
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
                error: !!errors.validThrough,
                fullWidth: true,
                helperText: errors.validThrough?.message,
              },
            }}
            value={validThrough ? dayjs(validThrough) : null}
            {...register("validThrough")}
            onChange={(date) =>
              setValue(
                "validThrough",
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
            disabled={isPointsRedeem}
            fullWidth
            helperText={
              isPointsRedeem
                ? tCoupons("pointsCost.exclusiveHint")
                : tCoupons(`issueTrigger.hint.${issueTrigger}`)
            }
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
        {issueTrigger === "spend" && !isPointsRedeem && (
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
              checked={isClaimable && !isPointsRedeem}
              disabled={isPointsRedeem}
              onChange={(_, checked) => setValue("isClaimable", checked)}
            />
          }
          label={tCoupons("isClaimable.label")}
          sx={{ alignSelf: "flex-start" }}
        />
        <FormHelperText>
          {isPointsRedeem
            ? tCoupons("pointsCost.exclusiveHint")
            : tCoupons("isClaimable.helperText")}
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormControlLabel
          control={
            <Switch
              checked={isPublic && !isPointsRedeem}
              disabled={isPointsRedeem}
              onChange={(_, checked) => setValue("isPublic", checked)}
            />
          }
          label={tCoupons("isPublic.label")}
          sx={{ alignSelf: "flex-start" }}
        />
        <FormHelperText>
          {isPointsRedeem
            ? tCoupons("pointsCost.exclusiveHint")
            : tCoupons("isPublic.helperText")}
        </FormHelperText>
      </FormControl>
    </FormBox>
  );
};

export default CouponDialog;
