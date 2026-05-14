"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  ITEM_AVAILABILITY_VALUES,
  type UpdateOfferForm,
  useUpdateOfferFormSchema,
} from "./definitions";

import CurrencySelect from "@/components/CurrencySelect";
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
      price: offer.price || "",
      priceCurrency: offer.priceCurrency || "TWD",
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
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            control={control}
            name="priceCurrency"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <CurrencySelect
                error={!!error}
                helperText={error?.message}
                label={tMenus("offers.priceCurrency.label")}
                onChange={({ currency }) => onChange(currency)}
                value={
                  currencies.find(({ currency }) => currency === value) ||
                  DEFAULT_CURRENCY_OPTION
                }
              />
            )}
          />
        </Grid>
      </Grid>
      <Controller
        control={control}
        name="availability"
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.availability}
            fullWidth
            helperText={errors.availability?.message}
            label={tMenus("offers.availability.label")}
            required
            select
          >
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
        )}
      />
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
          <TextField
            error={!!errors.validFrom}
            fullWidth
            helperText={errors.validFrom?.message}
            label={tMenus("offers.validFrom.label")}
            slotProps={{ inputLabel: { shrink: true } }}
            type="date"
            {...register("validFrom")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.validThrough}
            fullWidth
            helperText={errors.validThrough?.message}
            label={tMenus("offers.validThrough.label")}
            slotProps={{ inputLabel: { shrink: true } }}
            type="date"
            {...register("validThrough")}
          />
        </Grid>
      </Grid>
    </StyledBox>
  );
};

export default UpdateOfferDialog;
