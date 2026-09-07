"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useSupplierFormSchema, type SupplierForm } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Autocomplete, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Ingredient, Supplier } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface SupplierDialogProps {
  ingredients: Ingredient[];
  mutate: () => void;
  organizationSlug: string;
  supplier: Supplier | null;
}

const SupplierDialog = ({
  ingredients,
  mutate,
  organizationSlug,
  supplier,
}: SupplierDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const supplierFormSchema = useSupplierFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = useForm<SupplierForm>({
    defaultValues: {
      ingredientIds: supplier?.ingredients.map(({ id }) => id) || [],
      name: supplier?.name || "",
      note: supplier?.note || "",
      telephone: supplier?.telephone || "",
      url: supplier?.url || "",
    },
    resolver: zodResolver(supplierFormSchema),
  });

  const ingredientIds = useWatch({ control, name: "ingredientIds" });

  const assignableIngredients = ingredients.filter(
    ({ supplierId }) => !supplierId || supplierId === supplier?.id,
  );

  const action = supplier ? "updateSupplier" : "createSupplier";

  const onSubmitHandler = async (values: SupplierForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Supplier>(
        supplier
          ? `/api/suppliers/${supplier.id}`
          : `/api/organizations/${organizationSlug}/suppliers`,
        {
          method: supplier ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredientIds: values.ingredientIds,
            name: values.name,
            note: values.note || null,
            telephone: values.telephone || null,
            url: values.url || null,
          }),
        },
      );

      enqueueSnackbar(tInventory(`suppliers.actions.${action}.success`), {
        variant: "success",
      });

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tInventory(`suppliers.actions.${action}.error`), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="supplier-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tInventory("suppliers.name.label")}
        placeholder={tInventory("suppliers.name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.url}
        fullWidth
        helperText={errors.url?.message}
        label={`${tInventory("suppliers.url.label")} ${tCommon("optional")}`}
        placeholder={tInventory("suppliers.url.placeholder")}
        {...register("url")}
      />
      <TextField
        error={!!errors.telephone}
        fullWidth
        helperText={errors.telephone?.message}
        label={`${tInventory("suppliers.telephone.label")} ${tCommon("optional")}`}
        placeholder={tInventory("suppliers.telephone.placeholder")}
        {...register("telephone")}
      />
      <Autocomplete
        disableCloseOnSelect
        fullWidth
        getOptionLabel={({ name }) => localize(name, locale)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        multiple
        onChange={(_, value) =>
          setValue(
            "ingredientIds",
            value.map(({ id }) => id),
            { shouldValidate: isSubmitted },
          )
        }
        options={assignableIngredients}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`${tInventory("suppliers.ingredients.label")} ${tCommon("optional")}`}
            placeholder={tInventory("suppliers.ingredients.placeholder")}
          />
        )}
        value={assignableIngredients.filter(({ id }) =>
          ingredientIds.includes(id),
        )}
      />
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tInventory("suppliers.note.label")} ${tCommon("optional")}`}
        placeholder={tInventory("suppliers.note.placeholder")}
        {...register("note")}
      />
    </FormBox>
  );
};

export default SupplierDialog;
