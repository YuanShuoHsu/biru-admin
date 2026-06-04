"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type UpdateModifierGroupForm,
  useUpdateModifierGroupFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ModifierGroup } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

interface UpdateModifierGroupDialogProps {
  group: ModifierGroup;
  mutate: () => void;
}

const UpdateModifierGroupDialog = ({
  group,
  mutate,
}: UpdateModifierGroupDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const updateModifierGroupFormSchema = useUpdateModifierGroupFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateModifierGroupForm>({
    defaultValues: {
      displayName: group.displayName,
      minSelectionCount: String(group.minSelectionCount),
      maxSelectionCount:
        group.maxSelectionCount === null ? "" : String(group.maxSelectionCount),
    },
    resolver: zodResolver(updateModifierGroupFormSchema),
  });

  const onSubmitHandler = async ({
    displayName,
    minSelectionCount,
    maxSelectionCount,
  }: UpdateModifierGroupForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<ModifierGroup>(`/api/modifier-groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          ...(minSelectionCount?.trim() && {
            minSelectionCount: Number(minSelectionCount),
          }),
          maxSelectionCount: maxSelectionCount?.trim()
            ? Number(maxSelectionCount)
            : null,
        }),
      });

      enqueueSnackbar(
        tMenus("modifierGroups.actions.updateGroup.success", {
          name: displayName,
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus("modifierGroups.actions.updateGroup.error"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-modifier-group-form" onSubmit={onSubmit}>
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

export default UpdateModifierGroupDialog;
