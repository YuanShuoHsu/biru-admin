"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  ITEM_AVAILABILITY_VALUES,
  type UpdateOfferForm,
  useUpdateOfferFormSchema,
} from "./definitions";

import CountrySelect from "@/components/CountrySelect";
import NumberSpinner from "@/components/NumberSpinner";

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
    setValue,
  } = useForm<UpdateOfferForm, unknown, UpdateOfferForm>({
    defaultValues: {
      priceCurrency: offer.priceCurrency || "TWD",
      price: offer.price || "",
      availability: offer.availability || "InStock",
      eligibleQuantity: {
        value:
          offer.eligibleQuantity?.value != null
            ? String(offer.eligibleQuantity.value)
            : "",
        unitText: offer.eligibleQuantity?.unitText ?? "",
      },
      deliveryLeadTime: {
        value:
          offer.deliveryLeadTime?.value != null
            ? String(offer.deliveryLeadTime.value)
            : "",
        unitText: offer.deliveryLeadTime?.unitText ?? "",
      },
      inventoryLevel: {
        value:
          offer.inventoryLevel?.value != null
            ? String(offer.inventoryLevel.value)
            : "",
        unitText: offer.inventoryLevel?.unitText ?? "",
      },
      availabilityStarts: offer.availabilityStarts || "",
      availabilityEnds: offer.availabilityEnds || "",
      priceValidUntil: offer.priceValidUntil || "",
      validFrom: offer.validFrom || "",
      validThrough: offer.validThrough || "",
    },
    resolver: zodResolver(updateOfferFormSchema),
  });

  const priceCurrency = useWatch({ control, name: "priceCurrency" });
  const availability = useWatch({ control, name: "availability" });
  const eligibleQuantityValue = useWatch({
    control,
    name: "eligibleQuantity.value",
  });
  const deliveryLeadTimeValue = useWatch({
    control,
    name: "deliveryLeadTime.value",
  });
  const inventoryLevelValue = useWatch({
    control,
    name: "inventoryLevel.value",
  });
  const availabilityStarts = useWatch({ control, name: "availabilityStarts" });
  const availabilityEnds = useWatch({ control, name: "availabilityEnds" });
  const priceValidUntil = useWatch({ control, name: "priceValidUntil" });
  const validFrom = useWatch({ control, name: "validFrom" });
  const validThrough = useWatch({ control, name: "validThrough" });

  const buildQuantitativePayload = (qv?: {
    value?: string;
    unitText?: string;
  }) => {
    if (!qv) return null;
    const payload = {
      ...(qv.value && { value: Number(qv.value) }),
      ...(qv.unitText && { unitText: qv.unitText }),
    };
    return Object.keys(payload).length > 0 ? payload : null;
  };

  const onSubmitHandler = async ({
    price,
    priceCurrency,
    availability,
    eligibleQuantity,
    deliveryLeadTime,
    inventoryLevel,
    availabilityStarts,
    availabilityEnds,
    priceValidUntil,
    validFrom,
    validThrough,
  }: UpdateOfferForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price,
          priceCurrency,
          availability,
          eligibleQuantity: buildQuantitativePayload(eligibleQuantity),
          deliveryLeadTime: buildQuantitativePayload(deliveryLeadTime),
          inventoryLevel: buildQuantitativePayload(inventoryLevel),
          availabilityStarts: availabilityStarts || null,
          availabilityEnds: availabilityEnds || null,
          priceValidUntil: priceValidUntil || null,
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
      <Grid container spacing={2} sx={{ width: "100%" }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CountrySelect
            error={!!errors.priceCurrency}
            helperText={errors.priceCurrency?.message}
            label={tMenus("offers.priceCurrency.label")}
            mode="currency"
            value={
              currencies.find(({ currency }) => currency === priceCurrency) ||
              DEFAULT_CURRENCY_OPTION
            }
            {...register("priceCurrency")}
            onChange={(value) => {
              if ("currency" in value)
                setValue("priceCurrency", value.currency);
            }}
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
      <Grid container spacing={2} sx={{ width: "100%" }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.eligibleQuantity?.value}
            fullWidth
            helperText={errors.eligibleQuantity?.value?.message}
            label={tMenus("offers.eligibleQuantity.value.label")}
            min={0}
            placeholder={tMenus("offers.eligibleQuantity.value.placeholder")}
            value={
              eligibleQuantityValue !== ""
                ? Number(eligibleQuantityValue)
                : null
            }
            onValueChange={(val) =>
              setValue("eligibleQuantity.value", val != null ? String(val) : "")
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.eligibleQuantity?.unitText}
            fullWidth
            helperText={errors.eligibleQuantity?.unitText?.message}
            label={tMenus("offers.eligibleQuantity.unitText.label")}
            placeholder={tMenus("offers.eligibleQuantity.unitText.placeholder")}
            {...register("eligibleQuantity.unitText")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.deliveryLeadTime?.value}
            fullWidth
            helperText={errors.deliveryLeadTime?.value?.message}
            label={tMenus("offers.deliveryLeadTime.value.label")}
            min={0}
            placeholder={tMenus("offers.deliveryLeadTime.value.placeholder")}
            value={
              deliveryLeadTimeValue !== ""
                ? Number(deliveryLeadTimeValue)
                : null
            }
            onValueChange={(val) =>
              setValue("deliveryLeadTime.value", val != null ? String(val) : "")
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.deliveryLeadTime?.unitText}
            fullWidth
            helperText={errors.deliveryLeadTime?.unitText?.message}
            label={tMenus("offers.deliveryLeadTime.unitText.label")}
            placeholder={tMenus("offers.deliveryLeadTime.unitText.placeholder")}
            {...register("deliveryLeadTime.unitText")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.inventoryLevel?.value}
            fullWidth
            helperText={errors.inventoryLevel?.value?.message}
            label={tMenus("offers.inventoryLevel.value.label")}
            min={0}
            placeholder={tMenus("offers.inventoryLevel.value.placeholder")}
            value={
              inventoryLevelValue !== "" ? Number(inventoryLevelValue) : null
            }
            onValueChange={(val) =>
              setValue("inventoryLevel.value", val != null ? String(val) : "")
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.inventoryLevel?.unitText}
            fullWidth
            helperText={errors.inventoryLevel?.unitText?.message}
            label={tMenus("offers.inventoryLevel.unitText.label")}
            placeholder={tMenus("offers.inventoryLevel.unitText.placeholder")}
            {...register("inventoryLevel.unitText")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={tMenus("offers.availabilityStarts.label")}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.availabilityStarts,
                fullWidth: true,
                helperText: errors.availabilityStarts?.message,
              },
            }}
            value={availabilityStarts ? dayjs(availabilityStarts) : null}
            {...register("availabilityStarts")}
            onChange={(date) =>
              setValue(
                "availabilityStarts",
                date ? date.format("YYYY-MM-DD") : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={tMenus("offers.availabilityEnds.label")}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.availabilityEnds,
                fullWidth: true,
                helperText: errors.availabilityEnds?.message,
              },
            }}
            value={availabilityEnds ? dayjs(availabilityEnds) : null}
            {...register("availabilityEnds")}
            onChange={(date) =>
              setValue(
                "availabilityEnds",
                date ? date.format("YYYY-MM-DD") : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={tMenus("offers.priceValidUntil.label")}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.priceValidUntil,
                fullWidth: true,
                helperText: errors.priceValidUntil?.message,
              },
            }}
            value={priceValidUntil ? dayjs(priceValidUntil) : null}
            {...register("priceValidUntil")}
            onChange={(date) =>
              setValue("priceValidUntil", date ? date.format("YYYY-MM-DD") : "")
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={tMenus("offers.validFrom.label")}
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
              setValue("validFrom", date ? date.format("YYYY-MM-DD") : "")
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={tMenus("offers.validThrough.label")}
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
              setValue("validThrough", date ? date.format("YYYY-MM-DD") : "")
            }
          />
        </Grid>
      </Grid>
    </StyledBox>
  );
};

export default UpdateOfferDialog;
