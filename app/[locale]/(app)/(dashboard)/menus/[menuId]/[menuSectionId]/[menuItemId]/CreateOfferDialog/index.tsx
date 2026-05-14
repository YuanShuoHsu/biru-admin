"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  type CreateOfferForm,
  ITEM_AVAILABILITY_VALUES,
  useCreateOfferFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Box,
  type BoxProps,
  Grid,
  MenuItem,
  styled,
  TextField,
} from "@mui/material";

import CurrencySelect from "@/components/CurrencySelect";
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY_OPTION,
} from "@/constants/currencies";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Offer } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface CreateOfferDialogProps {
  menuItemId: string;
  mutateOffers: () => void;
}

const CreateOfferDialog = ({
  menuItemId,
  mutateOffers,
}: CreateOfferDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const createOfferFormSchema = useCreateOfferFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateOfferForm, unknown, CreateOfferForm>({
    defaultValues: {
      name: "",
      price: "",
      priceCurrency: "TWD",
      availability: "InStock",
      sku: "",
      eligibleQuantityMin: "",
      eligibleQuantityMax: "",
      validFrom: "",
      validThrough: "",
    },
    resolver: zodResolver(createOfferFormSchema),
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
  }: CreateOfferForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Offer>(`/api/menu-items/${menuItemId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(name && { name }),
          price,
          priceCurrency,
          availability,
          ...(sku && { sku }),
          ...(eligibleQuantityMin !== "" &&
            eligibleQuantityMin !== undefined && {
              eligibleQuantityMin: Number(eligibleQuantityMin),
            }),
          ...(eligibleQuantityMax !== "" &&
            eligibleQuantityMax !== undefined && {
              eligibleQuantityMax: Number(eligibleQuantityMax),
            }),
          ...(validFrom && { validFrom }),
          ...(validThrough && { validThrough }),
        }),
      });

      enqueueSnackbar(tMenus("offers.actions.createOffer.success"), {
        variant: "success",
      });

      closeDialog();
      mutateOffers();
    } catch {
      enqueueSnackbar(tMenus("offers.actions.createOffer.title"), {
        variant: "error",
      });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="create-offer-form" onSubmit={onSubmit}>
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
                  CURRENCY_OPTIONS.find(({ currency }) => currency === value) ||
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

export default CreateOfferDialog;
