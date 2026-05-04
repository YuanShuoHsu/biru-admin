"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type UpdateMenuSectionForm,
  useUpdateMenuSectionFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { Box, type BoxProps, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenuSection } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface UpdateMenuSectionDialogProps {
  section: AdminMenuSection;
  onSuccess: () => unknown;
}

const UpdateMenuSectionDialog = ({
  section,
  onSuccess,
}: UpdateMenuSectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

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
        }),
      });

      enqueueSnackbar(
        tMenus("sections.actions.updateSection.success", { name }),
        { variant: "success" },
      );

      closeDialog();
      onSuccess();
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
        multiline
        placeholder={tMenus("sections.description.placeholder")}
        rows={3}
        {...register("description")}
      />
    </StyledBox>
  );
};

export default UpdateMenuSectionDialog;
