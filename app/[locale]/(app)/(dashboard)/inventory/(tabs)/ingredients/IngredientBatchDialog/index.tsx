"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type IngredientBatchForm,
  useIngredientBatchFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api-client";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Ingredient } from "@/types/inventory";

import { getErrorMessage } from "@/utils/errors";
import type { FetchError } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

type ShortfallError = FetchError & {
  info?: { ingredients?: Pick<Ingredient, "id" | "name">[] };
};

interface IngredientBatchDialogProps {
  ingredient: Ingredient;
  mutate: () => void;
  organizationSlug: string;
}

const IngredientBatchDialog = ({
  ingredient,
  mutate,
  organizationSlug,
}: IngredientBatchDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const ingredientBatchFormSchema = useIngredientBatchFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<IngredientBatchForm>({
    defaultValues: { note: "", quantity: "" },
    resolver: zodResolver(ingredientBatchFormSchema),
  });

  const quantity = useWatch({ control, name: "quantity" });

  const onSubmitHandler = async (values: IngredientBatchForm) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.POST(
        "/api/organizations/{organizationSlug}/ingredients/{ingredientId}/batches",
        {
          params: {
            path: { ingredientId: ingredient.id, organizationSlug },
          },
          body: { note: values.note || null, quantity: values.quantity },
        },
      );

      enqueueSnackbar(
        tInventory("ingredients.actions.makeBatch.success", {
          name: localize(ingredient.name, locale),
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch (error) {
      const shortfalls = (error as ShortfallError).info?.ingredients;

      if (shortfalls?.length)
        setError("quantity", {
          message: tInventory("ingredients.actions.makeBatch.shortfall", {
            names: shortfalls
              .map(({ name }) => localize(name, locale))
              .join(tCommon("delimiter")),
          }),
        });
      else enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="ingredient-batch-form" onSubmit={onSubmit}>
      <NumericFormat
        allowNegative={false}
        customInput={TextField}
        decimalScale={3}
        error={!!errors.quantity}
        fullWidth
        helperText={
          errors.quantity?.message ||
          tInventory("ingredients.actions.makeBatch.quantity.helperText")
        }
        isAllowed={({ floatValue }) =>
          floatValue === undefined || floatValue <= 999999999.999
        }
        label={`${tInventory("ingredients.actions.makeBatch.quantity.label")}${tCommon("parenthesisOpen")}${tInventory(`units.${ingredient.unitCode}`)}${tCommon("parenthesisClose")}`}
        onValueChange={({ value }) =>
          setValue("quantity", value, { shouldValidate: isSubmitted })
        }
        placeholder={tInventory(
          "ingredients.actions.makeBatch.quantity.placeholder",
        )}
        required
        thousandSeparator=","
        value={quantity}
        valueIsNumericString
      />
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

export default IngredientBatchDialog;
