"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type CreateMenuSectionForm,
  useCreateMenuSectionFormSchema,
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

interface CreateMenuSectionDialogProps {
  menuId: string;
  onSuccess: () => unknown;
}

const CreateMenuSectionDialog = ({
  menuId,
  onSuccess,
}: CreateMenuSectionDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

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

      await fetcher<AdminMenuSection>(`/api/menus/${menuId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(description && { description }),
        }),
      });

      enqueueSnackbar(
        tMenus("sections.actions.createSection.success", { name }),
        { variant: "success" },
      );

      closeDialog();
      onSuccess();
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

export default CreateMenuSectionDialog;
