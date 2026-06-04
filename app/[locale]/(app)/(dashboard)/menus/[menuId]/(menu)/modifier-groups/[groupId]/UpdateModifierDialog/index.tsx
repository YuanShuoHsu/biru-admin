"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import { ITEM_AVAILABILITY_OPTIONS } from "../constants";
import {
  type UpdateModifierForm,
  useUpdateModifierFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

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
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<UpdateModifierForm>({
    defaultValues: {
      displayName: modifier.displayName,
      priceAdjustment: modifier.priceAdjustment ?? "",
      availability: modifier.availability ?? "InStock",
    },
    resolver: zodResolver(updateModifierFormSchema),
  });

  const priceAdjustment = useWatch({ control, name: "priceAdjustment" });

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
      <NumberSpinner
        clearable
        error={!!errors.priceAdjustment}
        fullWidth
        helperText={errors.priceAdjustment?.message}
        label={`${tMenus("modifiers.priceAdjustment.label")} ${tCommon("optional")}`}
        min={0}
        placeholder={tMenus("modifiers.priceAdjustment.placeholder")}
        step={1}
        value={priceAdjustment ? Number(priceAdjustment) : null}
        onValueChange={(value) =>
          setValue("priceAdjustment", value != null ? String(value) : "")
        }
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
