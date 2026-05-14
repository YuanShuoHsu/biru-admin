"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import UploadAvatars from "@/components/UploadAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

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

const CREATE_MENU_ITEM_IMAGE_KEY = "create-menu-item-image";

interface CreateMenuItemDialogProps {
  mutateItems: () => void;
  menuSectionId: string;
}

const CreateMenuItemDialog = ({
  mutateItems,
  menuSectionId,
}: CreateMenuItemDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const imageSrc = useUploadAvatarSrc(CREATE_MENU_ITEM_IMAGE_KEY);

  const createMenuItemFormSchema = useCreateMenuItemFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateMenuItemForm>({
    defaultValues: {
      name: "",
      description: "",
    },
    resolver: zodResolver(createMenuItemFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    description,
  }: CreateMenuItemForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuItem>(
        `/api/menu-sections/${menuSectionId}/menu-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            ...(description && { description }),
            ...(imageSrc && { image: imageSrc }),
          }),
        },
      );

      enqueueSnackbar(tMenus("items.actions.createItem.success", { name }), {
        variant: "success",
      });

      closeDialog();

      mutateItems();
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
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        shape="square"
        uploadKey={CREATE_MENU_ITEM_IMAGE_KEY}
      />
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
    </StyledBox>
  );
};

export default CreateMenuItemDialog;
