"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type UpdateModifierGroupForm,
  useUpdateModifierGroupFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

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
    control,
    handleSubmit,
    register,
    setValue,
  } = useForm<UpdateModifierGroupForm>({
    defaultValues: {
      displayName: group.displayName,
      minSelectionCount: String(group.minSelectionCount),
      maxSelectionCount:
        group.maxSelectionCount === null ? "" : String(group.maxSelectionCount),
    },
    resolver: zodResolver(updateModifierGroupFormSchema),
  });

  const minSelectionCount = useWatch({ control, name: "minSelectionCount" });
  const maxSelectionCount = useWatch({ control, name: "maxSelectionCount" });

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
      <NumberSpinner
        clearable
        error={!!errors.minSelectionCount}
        fullWidth
        helperText={errors.minSelectionCount?.message}
        label={`${tMenus("modifierGroups.minSelectionCount.label")} ${tCommon("optional")}`}
        min={0}
        placeholder={tMenus("modifierGroups.minSelectionCount.placeholder")}
        value={minSelectionCount !== "" ? Number(minSelectionCount) : null}
        onValueChange={(value) =>
          setValue("minSelectionCount", value != null ? String(value) : "")
        }
      />
      <NumberSpinner
        clearable
        error={!!errors.maxSelectionCount}
        fullWidth
        helperText={errors.maxSelectionCount?.message}
        label={`${tMenus("modifierGroups.maxSelectionCount.label")} ${tCommon("optional")}`}
        min={1}
        placeholder={tMenus("modifierGroups.maxSelectionCount.placeholder")}
        value={maxSelectionCount !== "" ? Number(maxSelectionCount) : null}
        onValueChange={(value) =>
          setValue("maxSelectionCount", value != null ? String(value) : "")
        }
      />
    </FormBox>
  );
};

export default UpdateModifierGroupDialog;
