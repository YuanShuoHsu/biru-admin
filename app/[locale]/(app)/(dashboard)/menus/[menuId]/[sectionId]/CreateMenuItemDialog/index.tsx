"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { CreateMenuItemForm, useCreateMenuItemFormSchema } from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItem } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface CreateMenuItemDialogProps {
  mutateRows: () => void;
  sectionId: string;
}

const CreateMenuItemDialog = ({
  mutateRows,
  sectionId,
}: CreateMenuItemDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const createMenuItemFormSchema = useCreateMenuItemFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateMenuItemForm>({
    defaultValues: {
      name: "",
      description: "",
      image: "",
      url: "",
    },
    resolver: zodResolver(createMenuItemFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    description,
    image,
    url,
  }: CreateMenuItemForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuItem>(`/api/menu-sections/${sectionId}/menu-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(description && { description }),
          ...(image && { image }),
          ...(url && { url }),
        }),
      });

      enqueueSnackbar(tMenus("items.actions.createItem.success", { name }), {
        variant: "success",
      });

      closeDialog();

      mutateRows();
    } catch {
      enqueueSnackbar(tMenus("items.actions.createItem.title"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="create-menu-item-form" onSubmit={onSubmit}>
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

export default CreateMenuItemDialog;
