"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type CreateMenuSectionForm,
  useCreateMenuSectionFormSchema,
} from "./definitions";

import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const CREATE_MENU_SECTION_IMAGE_KEY = "create-menu-section-image";

interface CreateMenuSectionDialogProps {
  menuId: string;
  mutate: () => void;
}

const CreateMenuSectionDialog = ({
  menuId,
  mutate,
}: CreateMenuSectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const imageSrc = useUploadAvatarSrc(CREATE_MENU_SECTION_IMAGE_KEY);

  const createMenuSectionFormSchema = useCreateMenuSectionFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateMenuSectionForm>({
    defaultValues: { name: "", description: "" },
    resolver: zodResolver(createMenuSectionFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    description,
  }: CreateMenuSectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuSection>(`/api/menus/${menuId}/menu-sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(description && { description }),
          ...(imageSrc && { image: imageSrc }),
        }),
      });

      enqueueSnackbar(
        tMenus("sections.actions.createSection.success", { name }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus("sections.actions.createSection.title"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="create-section-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        shape="square"
        uploadKey={CREATE_MENU_SECTION_IMAGE_KEY}
      />
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tMenus("sections.name.label")}
        placeholder={tMenus("sections.name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.description}
        fullWidth
        helperText={errors.description?.message}
        label={tMenus("sections.description.label")}
        maxRows={4}
        multiline
        placeholder={tMenus("sections.description.placeholder")}
        slotProps={{ htmlInput: { maxLength: 160 } }}
        {...register("description")}
      />
    </StyledBox>
  );
};

export default CreateMenuSectionDialog;
