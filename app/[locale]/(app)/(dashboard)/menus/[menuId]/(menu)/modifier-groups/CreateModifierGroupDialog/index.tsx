"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type CreateModifierGroupForm,
  useCreateModifierGroupFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ModifierGroup } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

interface CreateModifierGroupDialogProps {
  menuId: string;
  mutate: () => void;
}

const CreateModifierGroupDialog = ({
  menuId,
  mutate,
}: CreateModifierGroupDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const createModifierGroupFormSchema = useCreateModifierGroupFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateModifierGroupForm>({
    defaultValues: {
      displayName: "",
      minSelectionCount: "",
      maxSelectionCount: "",
    },
    resolver: zodResolver(createModifierGroupFormSchema),
  });

  const onSubmitHandler = async ({
    displayName,
    minSelectionCount,
    maxSelectionCount,
  }: CreateModifierGroupForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<ModifierGroup>(`/api/menus/${menuId}/modifier-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          ...(minSelectionCount?.trim() && {
            minSelectionCount: Number(minSelectionCount),
          }),
          ...(maxSelectionCount?.trim() && {
            maxSelectionCount: Number(maxSelectionCount),
          }),
        }),
      });

      enqueueSnackbar(
        tMenus("modifierGroups.actions.createGroup.success", {
          name: displayName,
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus("modifierGroups.actions.createGroup.error"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="create-modifier-group-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.displayName}
        fullWidth
        helperText={errors.displayName?.message}
        label={tMenus("modifierGroups.displayName.label")}
        placeholder={tMenus("modifierGroups.displayName.placeholder")}
        required
        {...register("displayName")}
      />
      <TextField
        error={!!errors.minSelectionCount}
        fullWidth
        helperText={errors.minSelectionCount?.message}
        label={`${tMenus("modifierGroups.minSelectionCount.label")} ${tCommon("optional")}`}
        placeholder={tMenus("modifierGroups.minSelectionCount.placeholder")}
        slotProps={{ htmlInput: { min: 0, step: 1 } }}
        type="number"
        {...register("minSelectionCount")}
      />
      <TextField
        error={!!errors.maxSelectionCount}
        fullWidth
        helperText={errors.maxSelectionCount?.message}
        label={`${tMenus("modifierGroups.maxSelectionCount.label")} ${tCommon("optional")}`}
        placeholder={tMenus("modifierGroups.maxSelectionCount.placeholder")}
        slotProps={{ htmlInput: { min: 1, step: 1 } }}
        type="number"
        {...register("maxSelectionCount")}
      />
    </FormBox>
  );
};

export default CreateModifierGroupDialog;
