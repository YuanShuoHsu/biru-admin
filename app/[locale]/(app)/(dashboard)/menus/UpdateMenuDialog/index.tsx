"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { type UpdateMenuForm, useUpdateMenuFormSchema } from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { LocaleEnum } from "@/enums/Locale";

import { fetcher } from "@/utils/fetcher";

import {
  Box,
  type BoxProps,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  styled,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminMenu } from "@/types/menus";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const LOCALE_OPTIONS = [
  { label: "繁體中文", value: LocaleEnum.ZhTW },
  { label: "English", value: LocaleEnum.En },
  { label: "日本語", value: LocaleEnum.Ja },
  { label: "한국어", value: LocaleEnum.Ko },
  { label: "简体中文", value: LocaleEnum.ZhCN },
];

interface UpdateMenuDialogProps {
  menu: AdminMenu;
  onSuccess: () => unknown;
}

const UpdateMenuDialog = ({ menu, onSuccess }: UpdateMenuDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const updateMenuFormSchema = useUpdateMenuFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateMenuForm>({
    defaultValues: {
      name: menu.name,
      description: menu.description ?? "",
      inLanguage: menu.inLanguage ?? LocaleEnum.ZhTW,
      image: menu.image ?? "",
    },
    resolver: zodResolver(updateMenuFormSchema),
  });

  const onSubmitHandler = async ({
    name,
    description,
    inLanguage,
    image,
  }: UpdateMenuForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<AdminMenu>(`/api/menus/${menu.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          inLanguage,
          image: image || undefined,
        }),
      });

      enqueueSnackbar(tMenus("actions.updateMenu.success", { name }), {
        variant: "success",
      });

      closeDialog();
      onSuccess();
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
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tMenus("name.label")}
        placeholder={tMenus("name.placeholder")}
        required
        {...register("name")}
      />
      <FormControl fullWidth error={!!errors.inLanguage}>
        <InputLabel required>{tMenus("inLanguage.label")}</InputLabel>
        <Select
          defaultValue={menu.inLanguage ?? LocaleEnum.ZhTW}
          label={tMenus("inLanguage.label")}
          {...register("inLanguage")}
        >
          {LOCALE_OPTIONS.map(({ label, value }) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
        {errors.inLanguage && (
          <FormHelperText>{errors.inLanguage.message}</FormHelperText>
        )}
      </FormControl>
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

export default UpdateMenuDialog;
