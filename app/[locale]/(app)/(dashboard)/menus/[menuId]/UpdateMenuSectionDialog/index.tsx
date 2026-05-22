"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type UpdateMenuSectionForm,
  useUpdateMenuSectionFormSchema,
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

interface UpdateMenuSectionDialogProps {
  mutateSections: () => void;
  section: MenuSection;
}

const UpdateMenuSectionDialog = ({
  mutateSections,
  section,
}: UpdateMenuSectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const uploadKey = `update-menu-section-image-${section.id}`;
  const imageSrc = useUploadAvatarSrc(uploadKey, section.image);

  const updateMenuSectionFormSchema = useUpdateMenuSectionFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateMenuSectionForm>({
    defaultValues: {
      name: section.name,
      description: section.description || "",
    },
    resolver: zodResolver(updateMenuSectionFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    description,
  }: UpdateMenuSectionForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/menu-sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          image: imageSrc || null,
        }),
      });

      enqueueSnackbar(
        tMenus("sections.actions.updateSection.success", { name }),
        { variant: "success" },
      );

      closeDialog();

      mutateSections();
    } catch {
      enqueueSnackbar(tMenus("sections.actions.updateSection.title"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="update-section-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        initialSrc={section.image}
        shape="square"
        uploadKey={uploadKey}
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
        {...register("description")}
      />
    </StyledBox>
  );
};

export default UpdateMenuSectionDialog;
