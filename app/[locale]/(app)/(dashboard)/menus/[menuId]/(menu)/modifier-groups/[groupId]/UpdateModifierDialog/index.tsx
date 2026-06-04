"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { ITEM_AVAILABILITY_OPTIONS } from "../constants";
import {
  type UpdateModifierForm,
  useUpdateModifierFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Modifier } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

interface UpdateModifierDialogProps {
  modifier: Modifier;
  mutate: () => void;
}

const UpdateModifierDialog = ({
  modifier,
  mutate,
}: UpdateModifierDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const updateModifierFormSchema = useUpdateModifierFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateModifierForm>({
    defaultValues: {
      displayName: modifier.displayName,
      priceAdjustment: modifier.priceAdjustment ?? "",
      availability: modifier.availability ?? "InStock",
    },
    resolver: zodResolver(updateModifierFormSchema),
  });

  const onSubmitHandler = async ({
    displayName,
    priceAdjustment,
    availability,
  }: UpdateModifierForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Modifier>(`/api/modifiers/${modifier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          priceAdjustment: priceAdjustment?.trim() ? priceAdjustment : null,
          ...(availability && { availability }),
        }),
      });

      enqueueSnackbar(
        tMenus("modifiers.actions.updateModifier.success", {
          name: displayName,
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus("modifiers.actions.updateModifier.error"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-modifier-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.displayName}
        fullWidth
        helperText={errors.displayName?.message}
        label={tMenus("modifiers.displayName.label")}
        placeholder={tMenus("modifiers.displayName.placeholder")}
        required
        {...register("displayName")}
      />
      <TextField
        error={!!errors.priceAdjustment}
        fullWidth
        helperText={errors.priceAdjustment?.message}
        label={`${tMenus("modifiers.priceAdjustment.label")} ${tCommon("optional")}`}
        placeholder={tMenus("modifiers.priceAdjustment.placeholder")}
        slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
        type="number"
        {...register("priceAdjustment")}
      />
      <TextField
        error={!!errors.availability}
        fullWidth
        label={tMenus("offers.availability.label")}
        select
        {...register("availability")}
        defaultValue={modifier.availability ?? "InStock"}
      >
        {ITEM_AVAILABILITY_OPTIONS.map((value) => (
          <MenuItem key={value} value={value}>
            {tMenus(`offers.availability.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
    </FormBox>
  );
};

export default UpdateModifierDialog;
