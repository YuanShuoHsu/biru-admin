"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import UploadAvatars from "@/components/UploadAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { type UpdateMenuForm, useUpdateMenuFormSchema } from "./definitions";

import { locales } from "@/constants/locale";

import { zodResolver } from "@hookform/resolvers/zod";

import { routing } from "@/i18n/routing";

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

interface UpdateMenuDialogProps {
  menu: Menu;
  mutateMenus: () => void;
}

const UpdateMenuDialog = ({
  menu: {
    id,
    name: menuName,
    description: menuDescription,
    inLanguage: menuLanguage,
    image: menuImage,
  },
  mutateMenus,
}: UpdateMenuDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const uploadKey = `update-menu-image-${id}`;
  const imageSrc = useUploadAvatarSrc(uploadKey, menuImage);

  const updateMenuFormSchema = useUpdateMenuFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateMenuForm>({
    defaultValues: {
      name: menuName,
      description: menuDescription || "",
      inLanguage: menuLanguage || routing.defaultLocale,
    },
    resolver: zodResolver(updateMenuFormSchema),
  });

  const inLanguage = useWatch({ control, name: "inLanguage" });

  const onSubmitHandler = async ({
    name,
    description,
    inLanguage,
  }: UpdateMenuForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Menu>(`/api/menus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          inLanguage,
          image: imageSrc || undefined,
        }),
      });

      enqueueSnackbar(tMenus("actions.updateMenu.success", { name }), {
        variant: "success",
      });

      closeDialog();

      mutateMenus();
    } catch {
      enqueueSnackbar(tMenus("actions.updateMenu.title"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="update-menu-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        initialSrc={menuImage}
        shape="square"
        uploadKey={uploadKey}
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
    </StyledBox>
  );
};

export default UpdateMenuDialog;
