"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type IngredientWasteFormInput,
  type IngredientWasteFormOutput,
  useIngredientWasteFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api-client";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { wasteReasonValues } from "@/types/api";
import type { Ingredient } from "@/types/inventory";

import { getErrorMessage } from "@/utils/errors";
import { localize } from "@/utils/locale";

interface IngredientWasteDialogProps {
  ingredient: Ingredient;
  mutate: () => void;
}

const IngredientWasteDialog = ({
  ingredient,
  mutate,
}: IngredientWasteDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const ingredientWasteFormSchema = useIngredientWasteFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<IngredientWasteFormInput, unknown, IngredientWasteFormOutput>({
    defaultValues: { note: "", quantity: "", wasteReason: "" },
    resolver: zodResolver(ingredientWasteFormSchema),
  });

  const quantity = useWatch({ control, name: "quantity" });
  const wasteReason = useWatch({ control, name: "wasteReason" });

  const onSubmitHandler = async (values: IngredientWasteFormOutput) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.POST("/api/ingredients/{ingredientId}/waste", {
        params: { path: { ingredientId: ingredient.id } },
        body: {
          note: values.note || null,
          quantity: values.quantity,
          wasteReason: values.wasteReason,
        },
      });

      enqueueSnackbar(
        tInventory("ingredients.actions.recordWaste.success", {
          name: localize(ingredient.name, locale),
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="ingredient-waste-form" onSubmit={onSubmit}>
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={3}
        error={!!errors.quantity}
        fullWidth
        helperText={errors.quantity?.message}
        isAllowed={({ floatValue }) =>
          floatValue === undefined || floatValue <= 999999999.999
        }
        label={`${tInventory("ingredients.actions.recordWaste.quantity.label")}${tCommon("parenthesisOpen")}${tInventory(`units.${ingredient.unitCode}`)}${tCommon("parenthesisClose")}`}
        onValueChange={({ value }) =>
          setValue("quantity", value, { shouldValidate: isSubmitted })
        }
        placeholder={tInventory(
          "ingredients.actions.recordWaste.quantity.placeholder",
        )}
        required
        thousandSeparator=","
        value={quantity}
        valueIsNumericString
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
        <MenuItem disabled value="">
          <em>{tInventory("transactions.wasteReason.placeholder")}</em>
        </MenuItem>
        {wasteReasonValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tInventory(`transactions.wasteReason.options.${value}`)}
          </MenuItem>
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

export default IngredientWasteDialog;
