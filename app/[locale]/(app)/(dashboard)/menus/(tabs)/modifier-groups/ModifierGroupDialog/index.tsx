"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type ModifierGroupForm,
  useModifierGroupFormSchema,
} from "../definitions";

import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";

import { MODIFIER_GROUP_MAX_SELECTION_COUNT } from "@/constants/menus";

import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api-client";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ModifierGroup } from "@/types/menus";

import { localize } from "@/utils/locale";

interface ModifierGroupDialogProps {
  group?: ModifierGroup;
  menuId: string;
  mutate: () => void;
}

const ModifierGroupDialog = ({
  group,
  menuId,
  mutate,
}: ModifierGroupDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const modifierGroupFormSchema = useModifierGroupFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<ModifierGroupForm>({
    defaultValues: {
      displayName: group?.displayName ?? {},
      minSelectionCount: group ? String(group.minSelectionCount) : "",
      maxSelectionCount:
        group?.maxSelectionCount == null ? "" : String(group.maxSelectionCount),
    },
    resolver: zodResolver(modifierGroupFormSchema),
  });

  const displayNameValue = useWatch({ control, name: "displayName" });
  const minSelectionCount = useWatch({ control, name: "minSelectionCount" });
  const maxSelectionCount = useWatch({ control, name: "maxSelectionCount" });

  const action = group ? "updateGroup" : "createGroup";

  const onSubmitHandler = async ({
    displayName,
    minSelectionCount,
    maxSelectionCount,
  }: ModifierGroupForm) => {
    try {
      setDialog({ confirmLoading: true });

      const body = {
        displayName,
        minSelectionCount: minSelectionCount ? Number(minSelectionCount) : 0,
      };

      if (group) {
        await apiClient.PATCH("/api/modifier-groups/{groupId}", {
          params: { path: { groupId: group.id } },
          body: {
            ...body,
            maxSelectionCount: maxSelectionCount
              ? Number(maxSelectionCount)
              : null,
          },
        });
      } else {
        await apiClient.POST("/api/menus/{menuId}/modifier-groups", {
          params: { path: { menuId } },
          body: {
            ...body,
            ...(maxSelectionCount && {
              maxSelectionCount: Number(maxSelectionCount),
            }),
          },
        });
      }

      enqueueSnackbar(
        tMenus(`modifierGroups.actions.${action}.success`, {
          name: localize(displayName, locale),
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch {
      enqueueSnackbar(tMenus(`modifierGroups.actions.${action}.error`), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="modifier-group-form" onSubmit={onSubmit}>
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
        max={Number(maxSelectionCount) || MODIFIER_GROUP_MAX_SELECTION_COUNT}
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
        max={MODIFIER_GROUP_MAX_SELECTION_COUNT}
        min={Math.max(1, Number(minSelectionCount) || 0)}
        placeholder={tMenus("modifierGroups.maxSelectionCount.placeholder")}
        value={maxSelectionCount !== "" ? Number(maxSelectionCount) : null}
        onValueChange={(value) =>
          setValue("maxSelectionCount", value != null ? String(value) : "")
        }
      />
    </FormBox>
  );
};

export default ModifierGroupDialog;
