"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
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
  toBaseQuantity,
  toPackages,
} from "@/utils/ingredients";
import { localize } from "@/utils/locale";

interface TransactionDialogProps {
  ingredient: Ingredient;
  mutate: () => void;
}

const TransactionDialog = ({ ingredient, mutate }: TransactionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const format = useFormatter();
  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const packageQuantity = ingredient.packageBaseQuantity;
  const currentLevel = Number(ingredient.inventoryLevel);
  const currentPackages = packageQuantity
    ? toPackages(currentLevel, packageQuantity)
    : 0;

  const transactionFormSchema = useTransactionFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<TransactionFormInput, unknown, TransactionFormOutput>({
    defaultValues: {
      inventoryLevel: packageQuantity ? String(currentPackages) : "",
    },
    resolver: zodResolver(transactionFormSchema),
  });

  const inventoryLevel = useWatch({ control, name: "inventoryLevel" });

  const targetLevel =
    !packageQuantity || Number(inventoryLevel || 0) === currentPackages
      ? currentLevel
      : toBaseQuantity(Number(inventoryLevel), packageQuantity);
  const delta = targetLevel - currentLevel;

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
            inventoryLevel: String(targetLevel),
            note: values.note || null,
            ...(delta > 0 &&
              ingredient.unitPrice != null && {
                unitCost: String(ingredient.unitPrice),
              }),
          }),
        },
      );

      enqueueSnackbar(
        tInventory("transactions.actions.recordTransaction.success", {
          name: localize(ingredient.name, locale),
        }),
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
          (packageQuantity && (Number(inventoryLevel) || delta)
            ? [
                `${format.number(targetLevel)} ${tInventory(`units.${ingredient.unitCode}`)}`,
                ...(delta
                  ? [
                      `${tCommon("parenthesisOpen")}${format.number(delta, { signDisplay: "exceptZero" })} ${tInventory(`units.${ingredient.unitCode}`)}${tCommon("parenthesisClose")}`,
                    ]
                  : []),
              ].join("")
            : "")
        }
        label={tInventory("transactions.inventoryLevel.label")}
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
