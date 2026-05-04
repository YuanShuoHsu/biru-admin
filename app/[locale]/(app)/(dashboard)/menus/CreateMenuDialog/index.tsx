"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { type CreateMenuForm, useCreateMenuFormSchema } from "./definitions";

import { locales } from "@/constants/locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { type Locale, routing } from "@/i18n/routing";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const LOCALE_OPTIONS = routing.locales.map((value) => ({
  label: locales[value].label,
  value,
}));

interface CreateMenuDialogProps {
  fetchMenus: () => void;
  organizationId: string;
  usedInLanguages: Locale[];
}

const CreateMenuDialog = ({
  fetchMenus,
  organizationId,
  usedInLanguages,
}: CreateMenuDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const availableLocaleOptions = LOCALE_OPTIONS.filter(
    ({ value }) => !usedInLanguages.includes(value),
  );

  const createMenuFormSchema = useCreateMenuFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateMenuForm>({
    defaultValues: {
      name: "",
      description: "",
      inLanguage: availableLocaleOptions[0]?.value || routing.defaultLocale,
      image: "",
    },
    resolver: zodResolver(createMenuFormSchema),
  });

  const inLanguage = useWatch({ control, name: "inLanguage" });

  const tMenus = useTranslations("menus");

  const onSubmitHandler = async ({
    name,
    description,
    inLanguage,
    image,
  }: CreateMenuForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<AdminMenu>(`/api/organizations/${organizationId}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(description && { description }),
          inLanguage,
          ...(image && { image }),
        }),
      });

      enqueueSnackbar(tMenus("actions.createMenu.success", { name }), {
        variant: "success",
      });

      closeDialog();

      fetchMenus();
    } catch {
      enqueueSnackbar(tMenus("actions.createMenu.title"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="create-menu-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tMenus("name.label")}
        placeholder={tMenus("name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.inLanguage}
        fullWidth
        helperText={errors.inLanguage?.message}
        label={tMenus("inLanguage.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const option = availableLocaleOptions.find(
                ({ value }) => value === selected,
              );

              return option ? (
                option.label
              ) : (
                <em>{tMenus("inLanguage.placeholder")}</em>
              );
            },
          },
        }}
        value={inLanguage}
        {...register("inLanguage")}
      >
        <MenuItem disabled value="">
          <em>{tMenus("inLanguage.placeholder")}</em>
        </MenuItem>
        {availableLocaleOptions.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.description}
        fullWidth
        helperText={errors.description?.message}
        label={tMenus("description.label")}
        multiline
        placeholder={tMenus("description.placeholder")}
        rows={3}
        {...register("description")}
      />
      <TextField
        error={!!errors.image}
        fullWidth
        helperText={errors.image?.message}
        label={tMenus("image.label")}
        placeholder={tMenus("image.placeholder")}
        {...register("image")}
      />
    </StyledBox>
  );
};

export default CreateMenuDialog;
