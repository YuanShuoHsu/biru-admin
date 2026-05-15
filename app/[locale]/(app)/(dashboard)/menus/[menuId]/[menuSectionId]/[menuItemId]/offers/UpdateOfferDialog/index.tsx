"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  ITEM_AVAILABILITY_VALUES,
  type UpdateOfferForm,
  useUpdateOfferFormSchema,
} from "./definitions";

import CountrySelect from "@/components/CountrySelect";

import { currencies, DEFAULT_CURRENCY_OPTION } from "@/constants/currencies";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Box,
  type BoxProps,
  Grid,
  MenuItem,
  styled,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Offer } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface UpdateOfferDialogProps {
  offer: Offer;
  mutateOffers: () => void;
}

const UpdateOfferDialog = ({ offer, mutateOffers }: UpdateOfferDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const updateOfferFormSchema = useUpdateOfferFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateOfferForm, unknown, UpdateOfferForm>({
    defaultValues: {
      name: offer.name || "",
      priceCurrency: offer.priceCurrency || "TWD",
      price: offer.price || "",
      availability: offer.availability || "InStock",
      sku: offer.sku || "",
      eligibleQuantityMin:
        offer.eligibleQuantityMin != null
          ? String(offer.eligibleQuantityMin)
          : "",
      eligibleQuantityMax:
        offer.eligibleQuantityMax != null
          ? String(offer.eligibleQuantityMax)
          : "",
      validFrom: offer.validFrom || "",
      validThrough: offer.validThrough || "",
    },
    resolver: zodResolver(updateOfferFormSchema),
  });

  const availability = useWatch({ control, name: "availability" });

  const onSubmitHandler = async ({
    name,
    price,
    priceCurrency,
    availability,
    sku,
    eligibleQuantityMin,
    eligibleQuantityMax,
    validFrom,
    validThrough,
  }: UpdateOfferForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || null,
          price,
          priceCurrency,
          availability,
          sku: sku || null,
          eligibleQuantityMin:
            eligibleQuantityMin !== "" && eligibleQuantityMin !== undefined
              ? Number(eligibleQuantityMin)
              : null,
          eligibleQuantityMax:
            eligibleQuantityMax !== "" && eligibleQuantityMax !== undefined
              ? Number(eligibleQuantityMax)
              : null,
          validFrom: validFrom || null,
          validThrough: validThrough || null,
        }),
      });

      enqueueSnackbar(tMenus("offers.actions.updateOffer.success"), {
        variant: "success",
      });

      closeDialog();
      mutateOffers();
    } catch {
      enqueueSnackbar(tMenus("offers.actions.updateOffer.title"), {
        variant: "error",
      });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="update-offer-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tMenus("offers.name.label")}
        placeholder={tMenus("offers.name.placeholder")}
        {...register("name")}
      />
      <Grid container spacing={2} sx={{ width: "100%" }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            control={control}
            name="priceCurrency"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CountrySelect
                error={!!error}
                helperText={error?.message}
                label={tMenus("offers.priceCurrency.label")}
                mode="currency"
                onChange={(value) => {
                  if ("currency" in value) onChange(value.currency);
                }}
                value={
                  currencies.find(({ currency }) => currency === value) ||
                  DEFAULT_CURRENCY_OPTION
                }
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            error={!!errors.price}
            fullWidth
            helperText={errors.price?.message}
            label={tMenus("offers.price.label")}
            placeholder={tMenus("offers.price.placeholder")}
            required
            {...register("price")}
          />
        </Grid>
      </Grid>
      <TextField
        error={!!errors.availability}
        fullWidth
        helperText={errors.availability?.message}
        label={tMenus("offers.availability.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) =>
              selected ? (
                tMenus(
                  `offers.availability.options.${selected}` as Parameters<
                    typeof tMenus
                  >[0],
                )
              ) : (
                <em>{tMenus("offers.availability.placeholder")}</em>
              ),
          },
        }}
        value={availability}
        {...register("availability")}
      >
        <MenuItem disabled value="">
          <em>{tMenus("offers.availability.placeholder")}</em>
        </MenuItem>
        {ITEM_AVAILABILITY_VALUES.map((value) => (
          <MenuItem key={value} value={value}>
            {tMenus(
              `offers.availability.options.${value}` as Parameters<
                typeof tMenus
              >[0],
            )}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.sku}
        fullWidth
        helperText={errors.sku?.message}
        label={tMenus("offers.sku.label")}
        placeholder={tMenus("offers.sku.placeholder")}
        {...register("sku")}
      />
      <Grid container spacing={2} sx={{ width: "100%" }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.eligibleQuantityMin}
            fullWidth
            helperText={errors.eligibleQuantityMin?.message}
            label={tMenus("offers.eligibleQuantityMin.label")}
            placeholder={tMenus("offers.eligibleQuantityMin.placeholder")}
            type="number"
            {...register("eligibleQuantityMin")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.eligibleQuantityMax}
            fullWidth
            helperText={errors.eligibleQuantityMax?.message}
            label={tMenus("offers.eligibleQuantityMax.label")}
            placeholder={tMenus("offers.eligibleQuantityMax.placeholder")}
            type="number"
            {...register("eligibleQuantityMax")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            control={control}
            name="validFrom"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <DatePicker
                label={tMenus("offers.validFrom.label")}
                onChange={(date) =>
                  onChange(date ? date.format("YYYY-MM-DD") : "")
                }
                slotProps={{
                  field: { clearable: true },
                  textField: {
                    error: !!error,
                    fullWidth: true,
                    helperText: error?.message,
                  },
                }}
                value={value ? dayjs(value) : null}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            control={control}
            name="validThrough"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <DatePicker
                label={tMenus("offers.validThrough.label")}
                onChange={(date) =>
                  onChange(date ? date.format("YYYY-MM-DD") : "")
                }
                slotProps={{
                  field: { clearable: true },
                  textField: {
                    error: !!error,
                    fullWidth: true,
                    helperText: error?.message,
                  },
                }}
                value={value ? dayjs(value) : null}
              />
            )}
          />
        </Grid>
      </Grid>
    </StyledBox>
  );
};

export default UpdateOfferDialog;
