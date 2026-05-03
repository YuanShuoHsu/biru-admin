"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { type CreateMenuForm, useCreateMenuFormSchema } from "./definitions";

import { locales } from "@/constants/locale";

import { LocaleEnum } from "@/enums/Locale";

import { zodResolver } from "@hookform/resolvers/zod";

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

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const LOCALE_OPTIONS = Object.entries(locales).map(([value, { label }]) => ({
  label,
  value,
}));

interface CreateMenuDialogProps {
  organizationId: string;
  onSuccess: () => unknown;
}

const CreateMenuDialog = ({
  organizationId,
  onSuccess,
}: CreateMenuDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const createMenuFormSchema = useCreateMenuFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateMenuForm>({
    defaultValues: {
      name: "",
      description: "",
      inLanguage: LocaleEnum.ZhTW,
      image: "",
    },
    resolver: zodResolver(createMenuFormSchema),
  });

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
      onSuccess();
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
      <FormControl fullWidth error={!!errors.inLanguage}>
        <InputLabel required>{tMenus("inLanguage.label")}</InputLabel>
        <Select
          defaultValue={LocaleEnum.ZhTW}
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

export default CreateMenuDialog;
