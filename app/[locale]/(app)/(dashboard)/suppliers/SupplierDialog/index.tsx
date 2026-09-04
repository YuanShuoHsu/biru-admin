"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { useSupplierFormSchema, type SupplierForm } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Supplier } from "@/types/inventory";

import { fetcher } from "@/utils/fetcher";

interface SupplierDialogProps {
  mutate: () => void;
  organizationSlug: string;
  supplier: Supplier | null;
}

const SupplierDialog = ({
  mutate,
  organizationSlug,
  supplier,
}: SupplierDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const supplierFormSchema = useSupplierFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<SupplierForm>({
    defaultValues: {
      name: supplier?.name || "",
      note: supplier?.note || "",
      telephone: supplier?.telephone || "",
      url: supplier?.url || "",
    },
    resolver: zodResolver(supplierFormSchema),
  });

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
        error={!!errors.telephone}
        fullWidth
        helperText={errors.telephone?.message}
        label={`${tInventory("suppliers.telephone.label")} ${tCommon("optional")}`}
        placeholder={tInventory("suppliers.telephone.placeholder")}
        {...register("telephone")}
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
