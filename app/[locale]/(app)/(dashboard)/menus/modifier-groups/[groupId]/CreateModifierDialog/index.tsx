"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type CreateModifierForm,
  useCreateModifierFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { itemAvailabilityValues } from "@/types/api";
import type { Modifier } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface CreateModifierDialogProps {
  modifierGroupId: string;
  mutate: () => void;
}

const CreateModifierDialog = ({
  modifierGroupId,
  mutate,
}: CreateModifierDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const createModifierFormSchema = useCreateModifierFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<CreateModifierForm>({
    defaultValues: {
      displayName: {},
      priceAdjustment: "",
      availability: "InStock",
    },
    resolver: zodResolver(createModifierFormSchema),
  });

  const displayNameValue = useWatch({ control, name: "displayName" });
  const priceAdjustment = useWatch({ control, name: "priceAdjustment" });

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
          name: localize(displayName, locale),
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
      <LocalizedTextFields
        fields={(lang) => [
          {
            error: !!errors.displayName?.root,
            fullWidth: true,
            helperText: errors.displayName?.root?.message,
            label: tMenus("modifiers.displayName.label"),
            onChange: (event) =>
              setValue("displayName", {
                ...displayNameValue,
                [lang]: event.target.value,
              }),
            placeholder: tMenus("modifiers.displayName.placeholder"),
            required: true,
            value: displayNameValue?.[lang] || "",
          },
        ]}
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
        defaultValue="InStock"
      >
        {itemAvailabilityValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tMenus(`offers.availability.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
    </FormBox>
  );
};

export default CreateModifierDialog;
