"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import CountrySelect from "@/components/CountrySelect";
import NumberSpinner from "@/components/NumberSpinner";

import { currencies, DEFAULT_CURRENCY_OPTION } from "@/constants/currencies";

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
    setValue,
  } = useForm<CreateOfferForm, unknown, CreateOfferForm>({
    defaultValues: {
      name: "",
      priceCurrency: "TWD",
      price: "",
      availability: "InStock",
      sku: "",
      eligibleQuantity: {
        maxValue: "",
        minValue: "",
        unitCode: "",
        unitText: "",
      },
      validFrom: "",
      validThrough: "",
    },
    resolver: zodResolver(createOfferFormSchema),
  });

  const priceCurrency = useWatch({ control, name: "priceCurrency" });
  const availability = useWatch({ control, name: "availability" });
  const minValue = useWatch({ control, name: "eligibleQuantity.minValue" });
  const maxValue = useWatch({ control, name: "eligibleQuantity.maxValue" });
  const validFrom = useWatch({ control, name: "validFrom" });
  const validThrough = useWatch({ control, name: "validThrough" });

  const onSubmitHandler = async ({
    name,
    priceCurrency,
    price,
    availability,
    sku,
    eligibleQuantity,
    validFrom,
    validThrough,
  }: CreateOfferForm) => {
    try {
      setDialog({ confirmLoading: true });

      const eligibleQuantityPayload = {
        ...(eligibleQuantity?.maxValue && {
          maxValue: Number(eligibleQuantity.maxValue),
        }),
        ...(eligibleQuantity?.minValue && {
          minValue: Number(eligibleQuantity.minValue),
        }),
        ...(eligibleQuantity?.unitCode && {
          unitCode: eligibleQuantity.unitCode,
        }),
        ...(eligibleQuantity?.unitText && {
          unitText: eligibleQuantity.unitText,
        }),
      };

      await fetcher<Offer>(`/api/menu-items/${menuItemId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(name && { name }),
          priceCurrency,
          price,
          availability,
          ...(sku && { sku }),
          ...(Object.keys(eligibleQuantityPayload).length > 0 && {
            eligibleQuantity: eligibleQuantityPayload,
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
      <Grid width="100%" container spacing={2}>
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
        {...register("availability")}
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
      <Grid width="100%" container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            error={!!errors.eligibleQuantity?.minValue}
            fullWidth
            helperText={errors.eligibleQuantity?.minValue?.message}
            label={tMenus("offers.eligibleQuantity.minValue.label")}
            placeholder={tMenus("offers.eligibleQuantity.minValue.placeholder")}
            value={minValue !== "" ? Number(minValue) : null}
            onValueChange={(val) =>
              setValue(
                "eligibleQuantity.minValue",
                val != null ? String(val) : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            error={!!errors.eligibleQuantity?.maxValue}
            fullWidth
            helperText={errors.eligibleQuantity?.maxValue?.message}
            label={tMenus("offers.eligibleQuantity.maxValue.label")}
            placeholder={tMenus("offers.eligibleQuantity.maxValue.placeholder")}
            value={maxValue !== "" ? Number(maxValue) : null}
            onValueChange={(val) =>
              setValue(
                "eligibleQuantity.maxValue",
                val != null ? String(val) : "",
              )
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
          <TextField
            error={!!errors.eligibleQuantity?.unitCode}
            fullWidth
            helperText={errors.eligibleQuantity?.unitCode?.message}
            label={tMenus("offers.eligibleQuantity.unitCode.label")}
            placeholder={tMenus("offers.eligibleQuantity.unitCode.placeholder")}
            {...register("eligibleQuantity.unitCode")}
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

export default CreateOfferDialog;
