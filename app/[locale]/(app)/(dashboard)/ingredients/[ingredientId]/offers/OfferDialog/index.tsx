"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  useIngredientOfferFormSchema,
  type IngredientOfferFormInput,
  type IngredientOfferFormOutput,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { unitCodeValues } from "@/types/api";
import type { Ingredient, IngredientOffer, Supplier } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";

interface OfferDialogProps {
  ingredient: Ingredient;
  mutate: () => void;
  offer: IngredientOffer | null;
  suppliers: Supplier[];
}

const OfferDialog = ({
  ingredient,
  mutate,
  offer,
  suppliers,
}: OfferDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const ingredientOfferFormSchema = useIngredientOfferFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<IngredientOfferFormInput, unknown, IngredientOfferFormOutput>({
    defaultValues: {
      eligibleQuantity: offer?.eligibleQuantity || "",
      eligibleQuantityUnitCode:
        offer?.eligibleQuantityUnitCode || ingredient.unitCode,
      price: offer?.price || "",
      supplierId: offer?.supplierId || "",
      url: offer?.url || "",
    },
    resolver: zodResolver(ingredientOfferFormSchema),
  });

  const eligibleQuantity = useWatch({ control, name: "eligibleQuantity" });
  const eligibleQuantityUnitCode = useWatch({
    control,
    name: "eligibleQuantityUnitCode",
  });
  const price = useWatch({ control, name: "price" });
  const supplierId = useWatch({ control, name: "supplierId" });

  const action = offer ? "updateOffer" : "createOffer";

  const onSubmitHandler = async (values: IngredientOfferFormOutput) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<IngredientOffer>(
        offer
          ? `/api/ingredients/${ingredient.id}/offers/${offer.id}`
          : `/api/ingredients/${ingredient.id}/offers`,
        {
          method: offer ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            supplierId: values.supplierId || null,
            url: values.url || null,
          }),
        },
      );

      enqueueSnackbar(tInventory(`offers.actions.${action}.success`), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tInventory(`offers.actions.${action}.error`), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="ingredient-offer-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.supplierId}
        fullWidth
        helperText={errors.supplierId?.message}
        label={`${tInventory("offers.supplierId.label")} ${tCommon("optional")}`}
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const supplier = suppliers.find(({ id }) => id === selected);

              return supplier ? (
                supplier.name
              ) : (
                <em>{tInventory("offers.supplierId.placeholder")}</em>
              );
            },
          },
        }}
        value={supplierId}
        {...register("supplierId")}
      >
        <MenuItem value="">
          <em>{tInventory("offers.supplierId.placeholder")}</em>
        </MenuItem>
        {suppliers.map(({ id, name }) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
      <NumberSpinner
        error={!!errors.price}
        fullWidth
        helperText={errors.price?.message}
        label={tInventory("offers.price.label")}
        min={0}
        onValueChange={(value) =>
          setValue("price", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("offers.price.placeholder")}
        required
        value={price ? Number(price) : null}
      />
      <NumberSpinner
        error={!!errors.eligibleQuantity}
        fullWidth
        helperText={errors.eligibleQuantity?.message}
        label={tInventory("offers.eligibleQuantity.label")}
        min={0}
        onValueChange={(value) =>
          setValue("eligibleQuantity", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("offers.eligibleQuantity.placeholder")}
        required
        value={eligibleQuantity ? Number(eligibleQuantity) : null}
      />
      <TextField
        error={!!errors.eligibleQuantityUnitCode}
        fullWidth
        helperText={errors.eligibleQuantityUnitCode?.message}
        label={tInventory("offers.eligibleQuantityUnitCode.label")}
        required
        select
        value={eligibleQuantityUnitCode}
        {...register("eligibleQuantityUnitCode")}
      >
        {unitCodeValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tInventory(`units.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.url}
        fullWidth
        helperText={errors.url?.message}
        label={`${tInventory("offers.url.label")} ${tCommon("optional")}`}
        placeholder={tInventory("offers.url.placeholder")}
        {...register("url")}
      />
    </FormBox>
  );
};

export default OfferDialog;
