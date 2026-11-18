"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type ProductWasteFormInput,
  type ProductWasteFormOutput,
  useProductWasteFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api-client";

import { MenuItem as MuiMenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { wasteReasonValues } from "@/types/api";
import type { MenuItem } from "@/types/menus";

import { getErrorMessage } from "@/utils/errors";
import { localize } from "@/utils/locale";

interface ProductWasteDialogProps {
  menuItem: MenuItem;
  organizationSlug: string;
}

const ProductWasteDialog = ({
  menuItem,
  organizationSlug,
}: ProductWasteDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const productWasteFormSchema = useProductWasteFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<ProductWasteFormInput, unknown, ProductWasteFormOutput>({
    defaultValues: { note: "", servings: "1", wasteReason: "" },
    resolver: zodResolver(productWasteFormSchema),
  });

  const servings = useWatch({ control, name: "servings" });
  const wasteReason = useWatch({ control, name: "wasteReason" });

  const onSubmitHandler = async (values: ProductWasteFormOutput) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.POST(
        "/api/organizations/{organizationSlug}/inventory/waste",
        {
          params: { path: { organizationSlug } },
          body: {
            menuItemId: menuItem.id,
            note: values.note || null,
            servings: Number(values.servings),
            wasteReason: values.wasteReason,
          },
        },
      );

      enqueueSnackbar(
        tInventory("recipes.actions.recordWaste.success", {
          name: localize(menuItem.name, locale),
        }),
        { variant: "success" },
      );

      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="product-waste-form" onSubmit={onSubmit}>
      <NumberSpinner
        error={!!errors.servings}
        fullWidth
        helperText={errors.servings?.message}
        label={tInventory("recipes.actions.recordWaste.servings.label")}
        max={9999}
        min={1}
        onValueChange={(value) =>
          setValue("servings", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory(
          "recipes.actions.recordWaste.servings.placeholder",
        )}
        required
        value={servings ? Number(servings) : null}
      />
      <TextField
        error={!!errors.wasteReason}
        fullWidth
        helperText={errors.wasteReason?.message}
        label={tInventory("transactions.wasteReason.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const value = wasteReasonValues.find(
                (reason) => reason === selected,
              );

              return value ? (
                tInventory(`transactions.wasteReason.options.${value}`)
              ) : (
                <em>{tInventory("transactions.wasteReason.placeholder")}</em>
              );
            },
          },
        }}
        value={wasteReason}
        {...register("wasteReason")}
      >
        <MuiMenuItem disabled value="">
          <em>{tInventory("transactions.wasteReason.placeholder")}</em>
        </MuiMenuItem>
        {wasteReasonValues.map((value) => (
          <MuiMenuItem key={value} value={value}>
            {tInventory(`transactions.wasteReason.options.${value}`)}
          </MuiMenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tInventory("ingredients.transactionNote.label")} ${tCommon("optional")}`}
        placeholder={tInventory("ingredients.transactionNote.placeholder")}
        {...register("note")}
      />
    </FormBox>
  );
};

export default ProductWasteDialog;
