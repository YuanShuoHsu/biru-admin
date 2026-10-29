"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type UpdateModifierGroupForm,
  useUpdateModifierGroupFormSchema,
} from "./definitions";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";
import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api-client";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { ModifierGroup } from "@/types/menus";

import { localize } from "@/utils/locale";

interface UpdateModifierGroupDialogProps {
  group: ModifierGroup;
  mutate: () => void;
}

const UpdateModifierGroupDialog = ({
  group,
  mutate,
}: UpdateModifierGroupDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const updateModifierGroupFormSchema = useUpdateModifierGroupFormSchema();
  const {
    formState: { errors },
    control,
    handleSubmit,
    setValue,
  } = useForm<UpdateModifierGroupForm>({
    defaultValues: {
      displayName: group.displayName ?? {},
      minSelectionCount: String(group.minSelectionCount),
      maxSelectionCount:
        group.maxSelectionCount === null ? "" : String(group.maxSelectionCount),
    },
    resolver: zodResolver(updateModifierGroupFormSchema),
  });

  const displayNameValue = useWatch({ control, name: "displayName" });
  const minSelectionCount = useWatch({ control, name: "minSelectionCount" });
  const maxSelectionCount = useWatch({ control, name: "maxSelectionCount" });

  const onSubmitHandler = async ({
    displayName,
    minSelectionCount,
    maxSelectionCount,
  }: UpdateModifierGroupForm) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.PATCH("/api/modifier-groups/{groupId}", {
        params: { path: { groupId: group.id } },
        body: {
          displayName,
          minSelectionCount: minSelectionCount ? Number(minSelectionCount) : 0,
          maxSelectionCount: maxSelectionCount
            ? Number(maxSelectionCount)
            : null,
        },
      });

      enqueueSnackbar(
        tMenus("modifierGroups.actions.updateGroup.success", {
          name: localize(displayName, locale),
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
    <>
      <CustomizedDialogContent>
        <FormBox id="update-modifier-group-form" onSubmit={onSubmit}>
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
            max={Number(maxSelectionCount) || undefined}
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
            min={Math.max(1, Number(minSelectionCount) || 0)}
            placeholder={tMenus("modifierGroups.maxSelectionCount.placeholder")}
            value={maxSelectionCount !== "" ? Number(maxSelectionCount) : null}
            onValueChange={(value) =>
              setValue("maxSelectionCount", value != null ? String(value) : "")
            }
          />
        </FormBox>
      </CustomizedDialogContent>
      <CustomizedDialogActions />
    </>
  );
};

export default UpdateModifierGroupDialog;
