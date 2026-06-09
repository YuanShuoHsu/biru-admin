"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type CreateModifierGroupForm,
  useCreateModifierGroupFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ModifierGroup } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface CreateModifierGroupDialogProps {
  menuId: string;
  mutate: () => void;
}

const CreateModifierGroupDialog = ({
  menuId,
  mutate,
}: CreateModifierGroupDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const createModifierGroupFormSchema = useCreateModifierGroupFormSchema();
  const {
    formState: { errors },
    control,
    handleSubmit,
    setValue,
  } = useForm<CreateModifierGroupForm>({
    defaultValues: {
      displayName: {},
      minSelectionCount: "",
      maxSelectionCount: "",
    },
    resolver: zodResolver(createModifierGroupFormSchema),
  });

  const displayNameValue = useWatch({ control, name: "displayName" });
  const minSelectionCount = useWatch({ control, name: "minSelectionCount" });
  const maxSelectionCount = useWatch({ control, name: "maxSelectionCount" });

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
          name: localize(displayName, locale),
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
      <LocalizedTextFields
        fields={(lang) => [
          {
            error: !!errors.displayName?.[lang],
            fullWidth: true,
            helperText: errors.displayName?.[lang]?.message,
            label: tMenus("modifierGroups.displayName.label"),
            onChange: (event) =>
              setValue("displayName", {
                ...displayNameValue,
                [lang]: event.target.value,
              }),
            placeholder: tMenus("modifierGroups.displayName.placeholder"),
            required: true,
            value: displayNameValue?.[lang] || "",
          },
        ]}
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

export default CreateModifierGroupDialog;
