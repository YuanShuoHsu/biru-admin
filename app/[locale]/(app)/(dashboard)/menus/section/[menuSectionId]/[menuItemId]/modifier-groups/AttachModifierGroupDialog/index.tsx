"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import {
  type AttachModifierGroupForm,
  useAttachModifierGroupFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItemModifierGroup, ModifierGroup } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface AttachModifierGroupDialogProps {
  menuId: string;
  menuItemId: string;
  mutate: () => void;
}

const AttachModifierGroupDialog = ({
  menuId,
  menuItemId,
  mutate,
}: AttachModifierGroupDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tMenus = useTranslations("menus");

  const attachModifierGroupFormSchema = useAttachModifierGroupFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<AttachModifierGroupForm>({
    defaultValues: { modifierGroupId: "" },
    resolver: zodResolver(attachModifierGroupFormSchema),
  });

  const modifierGroupId = useWatch({ control, name: "modifierGroupId" });

  const { data: groups = [] } = useSWR(
    `/api/menus/${menuId}/modifier-groups?limit=100&offset=0`,
    () =>
      fetcher<{ data: ModifierGroup[] }>(
        `/api/menus/${menuId}/modifier-groups?limit=100&offset=0`,
      ).then(({ data }) => data || []),
  );

  const { data: links = [] } = useSWR(
    `/api/menu-items/${menuItemId}/modifier-groups?limit=100&offset=0`,
    () =>
      fetcher<{ data: MenuItemModifierGroup[] }>(
        `/api/menu-items/${menuItemId}/modifier-groups?limit=100&offset=0`,
      ).then(({ data }) => data || []),
  );

  const usedGroupIds = new Set(
    links.map(({ modifierGroupId }) => modifierGroupId),
  );

  const onSubmitHandler = async ({
    modifierGroupId,
  }: AttachModifierGroupForm) => {
    const displayName = localize(
      groups.find(({ id }) => id === modifierGroupId)?.displayName,
      locale,
    );

    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuItemModifierGroup>(
        `/api/menu-items/${menuItemId}/modifier-groups`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modifierGroupId }),
        },
      );

      enqueueSnackbar(
        tMenus("itemModifierGroups.actions.attach.success", {
          name: displayName,
        }),
        { variant: "success" },
      );

      closeDialog();
      mutate();
    } catch {
      enqueueSnackbar(tMenus("itemModifierGroups.actions.attach.error"), {
        variant: "error",
      });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="attach-modifier-group-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.modifierGroupId}
        fullWidth
        helperText={errors.modifierGroupId?.message}
        label={tMenus("itemModifierGroups.group.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const group = groups.find(({ id }) => id === selected);

              return group ? (
                localize(group.displayName, locale)
              ) : (
                <em>{tMenus("itemModifierGroups.group.placeholder")}</em>
              );
            },
          },
        }}
        value={modifierGroupId}
        {...register("modifierGroupId")}
      >
        <MenuItem disabled value="">
          <em>{tMenus("itemModifierGroups.group.placeholder")}</em>
        </MenuItem>
        {groups.map(({ id, displayName }) => (
          <MenuItem disabled={usedGroupIds.has(id)} key={id} value={id}>
            {localize(displayName, locale)}
          </MenuItem>
        ))}
      </TextField>
    </FormBox>
  );
};

export default AttachModifierGroupDialog;
