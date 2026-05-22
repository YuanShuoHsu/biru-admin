"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import UploadAvatars from "@/components/UploadAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { type CreateMenuForm, useCreateMenuFormSchema } from "./definitions";

import { locales } from "@/constants/locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { type Locale, routing } from "@/i18n/routing";

import { Box, type BoxProps, MenuItem, TextField, styled } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Menu } from "@/types/menus";

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

const CREATE_MENU_IMAGE_KEY = "create-menu-image";

interface CreateMenuDialogProps {
  mutateMenus: () => void;
  organizationId: string;
  usedInLanguages: Locale[];
}

const CreateMenuDialog = ({
  mutateMenus,
  organizationId,
  usedInLanguages,
}: CreateMenuDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const firstAvailableLocale =
    LOCALE_OPTIONS.find(({ value }) => !usedInLanguages.includes(value))
      ?.value || routing.defaultLocale;

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
      inLanguage: firstAvailableLocale,
    },
    resolver: zodResolver(createMenuFormSchema),
  });

  const inLanguage = useWatch({ control, name: "inLanguage" });
  const imageSrc = useUploadAvatarSrc(CREATE_MENU_IMAGE_KEY);

  const tMenus = useTranslations("menus");

  const onSubmitHandler = async ({
    name,
    description,
    inLanguage,
  }: CreateMenuForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Menu>(`/api/organizations/${organizationId}/menus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(description && { description }),
          inLanguage,
          ...(imageSrc && { image: imageSrc }),
        }),
      });

      enqueueSnackbar(tMenus("actions.createMenu.success", { name }), {
        variant: "success",
      });

      closeDialog();

      mutateMenus();
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
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        shape="square"
        uploadKey={CREATE_MENU_IMAGE_KEY}
      />
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
              const option = LOCALE_OPTIONS.find(
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
        {LOCALE_OPTIONS.map(({ label, value }) => (
          <MenuItem
            disabled={usedInLanguages.includes(value)}
            key={value}
            value={value}
          >
            {label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.description}
        fullWidth
        helperText={errors.description?.message}
        label={tMenus("description.label")}
        maxRows={4}
        multiline
        placeholder={tMenus("description.placeholder")}
        {...register("description")}
      />
    </StyledBox>
  );
};

export default CreateMenuDialog;
