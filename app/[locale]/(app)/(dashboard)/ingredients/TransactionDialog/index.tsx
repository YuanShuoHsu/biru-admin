"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  useTransactionFormSchema,
  type TransactionFormInput,
  type TransactionFormOutput,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { manualInventoryTransactionTypeValues } from "@/types/api";
import type { Ingredient, InventoryTransaction } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";

interface TransactionDialogProps {
  ingredient: Ingredient;
  mutate: () => void;
}

const TransactionDialog = ({ ingredient, mutate }: TransactionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const transactionFormSchema = useTransactionFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<TransactionFormInput, unknown, TransactionFormOutput>({
    defaultValues: { note: "", quantity: "", type: "purchase", unitCost: "" },
    resolver: zodResolver(transactionFormSchema),
  });

  const quantity = useWatch({ control, name: "quantity" });
  const type = useWatch({ control, name: "type" });
  const unitCost = useWatch({ control, name: "unitCost" });

  const isStocktake = type === "adjustment";

  const onSubmitHandler = async (values: TransactionFormOutput) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<InventoryTransaction>(
        `/api/ingredients/${ingredient.id}/inventory-transactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            note: values.note || null,
            quantity: values.quantity,
            type: values.type,
            ...(values.type === "purchase" &&
              values.unitCost && { unitCost: values.unitCost }),
          }),
        },
      );

      enqueueSnackbar(
        tInventory("transactions.actions.recordTransaction.success"),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(
        tInventory("transactions.actions.recordTransaction.error"),
        { variant: "error" },
      );

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="transaction-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.type}
        fullWidth
        helperText={errors.type?.message}
        label={tInventory("transactions.type.label")}
        required
        select
        value={type}
        {...register("type")}
      >
        {manualInventoryTransactionTypeValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tInventory(`transactions.type.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <NumberSpinner
        error={!!errors.quantity}
        fullWidth
        helperText={
          errors.quantity?.message || tInventory(`units.${ingredient.unitCode}`)
        }
        label={tInventory(
          isStocktake
            ? "transactions.quantity.stocktakeLabel"
            : "transactions.quantity.label",
        )}
        min={0}
        onValueChange={(value) =>
          setValue("quantity", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory(
          isStocktake
            ? "transactions.quantity.stocktakePlaceholder"
            : "transactions.quantity.placeholder",
        )}
        required
        value={quantity ? Number(quantity) : null}
      />
      {type === "purchase" && (
        <NumberSpinner
          clearable
          error={!!errors.unitCost}
          fullWidth
          helperText={errors.unitCost?.message}
          label={`${tInventory("transactions.unitCost.label")} ${tCommon("optional")}`}
          min={0}
          onValueChange={(value) =>
            setValue("unitCost", value != null ? String(value) : "", {
              shouldValidate: isSubmitted,
            })
          }
          placeholder={tInventory("transactions.unitCost.placeholder")}
          value={unitCost ? Number(unitCost) : null}
        />
      )}
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tInventory("transactions.note.label")} ${tCommon("optional")}`}
        placeholder={tInventory("transactions.note.placeholder")}
        {...register("note")}
      />
    </FormBox>
  );
};

export default TransactionDialog;
