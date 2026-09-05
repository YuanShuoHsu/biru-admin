"use client";

import { useFormatter, useTranslations } from "next-intl";
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

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Ingredient, InventoryTransaction } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import {
  formatPackage,
  formatUnitPrice,
  labelWithPackageUnit,
} from "@/utils/ingredients";

interface TransactionDialogProps {
  ingredient: Ingredient;
  mutate: () => void;
}

const TransactionDialog = ({ ingredient, mutate }: TransactionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const transactionFormSchema = useTransactionFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    setValue,
  } = useForm<TransactionFormInput, unknown, TransactionFormOutput>({
    defaultValues: {
      inventoryLevel: ingredient.packageBaseQuantity
        ? String(
            Number(ingredient.inventoryLevel) / ingredient.packageBaseQuantity,
          )
        : "",
    },
    resolver: zodResolver(transactionFormSchema),
  });

  const inventoryLevel = useWatch({ control, name: "inventoryLevel" });

  const packageQuantity = ingredient.packageBaseQuantity;
  const delta = packageQuantity
    ? Number(inventoryLevel || 0) * packageQuantity -
      Number(ingredient.inventoryLevel)
    : 0;

  const onSubmitHandler = async (values: TransactionFormOutput) => {
    if (!packageQuantity) {
      enqueueSnackbar(tInventory("transactions.package.empty"), {
        variant: "error",
      });

      return;
    }

    try {
      setDialog({ confirmLoading: true });

      await fetcher<InventoryTransaction>(
        `/api/ingredients/${ingredient.id}/inventory-transactions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inventoryLevel: String(
              Number(values.inventoryLevel) * packageQuantity,
            ),
            // 數量變多才是進貨，此時記下當下的採購單價
            ...(delta > 0 &&
              ingredient.unitPrice != null && {
                unitCost: String(ingredient.unitPrice),
              }),
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
        disabled
        error={!packageQuantity}
        fullWidth
        helperText={
          packageQuantity
            ? formatUnitPrice(ingredient, { format, tCommon, tInventory })
            : tInventory("transactions.package.empty")
        }
        label={tInventory("transactions.package.label")}
        value={formatPackage(ingredient, { format, tCommon, tInventory })}
      />
      <NumberSpinner
        error={!!errors.inventoryLevel}
        fullWidth
        helperText={
          errors.inventoryLevel?.message ||
          (packageQuantity
            ? [
                `${format.number(Number(inventoryLevel || 0) * packageQuantity)} ${tInventory(`units.${ingredient.unitCode}`)}`,
                ...(delta
                  ? [
                      `${tCommon("parenthesisOpen")}${format.number(delta, { signDisplay: "exceptZero" })} ${tInventory(`units.${ingredient.unitCode}`)}${tCommon("parenthesisClose")}`,
                    ]
                  : []),
              ].join("")
            : "")
        }
        label={labelWithPackageUnit(
          tInventory("transactions.inventoryLevel.label"),
          tCommon,
          tInventory,
        )}
        min={0}
        onValueChange={(value) =>
          setValue("inventoryLevel", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory("transactions.inventoryLevel.placeholder")}
        required
        value={inventoryLevel ? Number(inventoryLevel) : null}
      />
    </FormBox>
  );
};

export default TransactionDialog;
