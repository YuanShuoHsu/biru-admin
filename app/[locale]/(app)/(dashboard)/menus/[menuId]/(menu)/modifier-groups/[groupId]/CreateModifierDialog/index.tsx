"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { ITEM_AVAILABILITY_OPTIONS } from "../constants";
import {
  type CreateModifierForm,
  useCreateModifierFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { Modifier } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

interface CreateModifierDialogProps {
  modifierGroupId: string;
  mutate: () => void;
}

const CreateModifierDialog = ({
  modifierGroupId,
  mutate,
}: CreateModifierDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const createModifierFormSchema = useCreateModifierFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CreateModifierForm>({
    defaultValues: {
      displayName: "",
      priceAdjustment: "",
      availability: "InStock",
    },
    resolver: zodResolver(createModifierFormSchema),
  });

  const onSubmitHandler = async ({
    displayName,
    priceAdjustment,
    availability,
  }: CreateModifierForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<Modifier>(
        `/api/modifier-groups/${modifierGroupId}/modifiers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName,
            ...(priceAdjustment?.trim() && { priceAdjustment }),
            ...(availability && { availability }),
          }),
        },
      );

      enqueueSnackbar(
        tMenus("modifiers.actions.createModifier.success", {
          name: displayName,
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus("modifiers.actions.createModifier.error"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="create-modifier-form" onSubmit={onSubmit}>
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
        defaultValue="InStock"
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

export default CreateModifierDialog;
