"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import UploadAvatars from "@/components/UploadAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import {
  type UpdateMenuItemForm,
  useUpdateMenuItemFormSchema,
} from "./definitions";

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

interface UpdateMenuItemDialogProps {
  item: MenuItem;
  mutateItems: () => void;
}

const UpdateMenuItemDialog = ({
  item,
  mutateItems,
}: UpdateMenuItemDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const uploadKey = `update-menu-item-image-${item.id}`;
  const imageSrc = useUploadAvatarSrc(uploadKey, item.image);

  const updateMenuItemFormSchema = useUpdateMenuItemFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateMenuItemForm>({
    defaultValues: {
      name: item.name,
      description: item.description || "",
    },
    resolver: zodResolver(updateMenuItemFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    description,
  }: UpdateMenuItemForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          image: imageSrc || null,
        }),
      });

      enqueueSnackbar(tMenus("items.actions.updateItem.success", { name }), {
        variant: "success",
      });

      closeDialog();

      mutateItems();
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
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        initialSrc={item.image}
        shape="square"
        uploadKey={uploadKey}
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

export default UpdateMenuItemDialog;
