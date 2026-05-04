"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type UpdateMenuItemForm,
  useUpdateMenuItemFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenuItem } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface UpdateMenuItemDialogProps {
  item: AdminMenuItem;
  mutateRows: () => unknown;
}

const UpdateMenuItemDialog = ({
  item,
  mutateRows,
}: UpdateMenuItemDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const updateMenuItemFormSchema = useUpdateMenuItemFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateMenuItemForm>({
    defaultValues: {
      name: item.name,
      description: item.description || "",
      image: item.image || "",
      url: item.url || "",
    },
    resolver: zodResolver(updateMenuItemFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    description,
    image,
    url,
  }: UpdateMenuItemForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          image: image || null,
          url: url || null,
        }),
      });

      enqueueSnackbar(tMenus("items.actions.updateItem.success", { name }), {
        variant: "success",
      });

      closeDialog();
      mutateRows();
    } catch {
      enqueueSnackbar(tMenus("items.actions.updateItem.title"), {
        variant: "error",
      });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="update-menu-item-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tMenus("items.name.label")}
        placeholder={tMenus("items.name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.description}
        fullWidth
        helperText={errors.description?.message}
        label={tMenus("items.description.label")}
        multiline
        placeholder={tMenus("items.description.placeholder")}
        rows={3}
        {...register("description")}
      />
      <TextField
        error={!!errors.image}
        fullWidth
        helperText={errors.image?.message}
        label={tMenus("items.image.label")}
        placeholder={tMenus("items.image.placeholder")}
        {...register("image")}
      />
      <TextField
        error={!!errors.url}
        fullWidth
        helperText={errors.url?.message}
        label={tMenus("items.url.label")}
        placeholder={tMenus("items.url.placeholder")}
        {...register("url")}
      />
    </StyledBox>
  );
};

export default UpdateMenuItemDialog;
