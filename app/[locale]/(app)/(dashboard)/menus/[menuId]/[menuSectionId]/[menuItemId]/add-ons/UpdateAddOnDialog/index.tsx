"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import { type UpdateAddOnForm, useUpdateAddOnFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Clear } from "@mui/icons-material";
import {
  IconButton,
  InputAdornment,
  MenuItem,
  styled,
  TextField,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  MenuItemAddOn,
  MenuItem as MenuItemType,
  MenuSection,
} from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledInputAdornment = styled(InputAdornment)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

interface UpdateAddOnDialogProps {
  addOn: MenuItemAddOn;
  menuId: string;
  mutate: () => void;
}

const UpdateAddOnDialog = ({
  addOn,
  menuId,
  mutate,
}: UpdateAddOnDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const updateAddOnFormSchema = useUpdateAddOnFormSchema();
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    control,
  } = useForm<UpdateAddOnForm>({
    defaultValues: {
      addOnMenuSectionId:
        addOn.addOnMenuSectionId || addOn.addOnMenuItemSectionId || "",
      addOnMenuItemId: addOn.addOnMenuItemId || "",
    },
    resolver: zodResolver(updateAddOnFormSchema),
  });

  const addOnMenuSectionId = useWatch({ control, name: "addOnMenuSectionId" });
  const addOnMenuItemId = useWatch({ control, name: "addOnMenuItemId" });

  const { data: addOns = [] } = useSWR(
    `/api/menu-items/${addOn.menuItemId}/add-ons?limit=100&offset=0`,
    () =>
      fetcher<{ data: MenuItemAddOn[]; total: number }>(
        `/api/menu-items/${addOn.menuItemId}/add-ons?limit=100&offset=0`,
      ).then(({ data }) => data),
  );

  const otherAddOns = addOns.filter(({ id }) => id !== addOn.id);
  const usedSectionIds = new Set(
    otherAddOns.flatMap(({ addOnMenuSectionId }) => addOnMenuSectionId || []),
  );
  const usedItemIds = new Set(
    otherAddOns.flatMap(({ addOnMenuItemId }) => addOnMenuItemId || []),
  );

  const { data: sections = [] } = useSWR(
    `/api/menus/${menuId}/menu-sections?limit=100&offset=0`,
    () =>
      fetcher<{ data: MenuSection[] }>(
        `/api/menus/${menuId}/menu-sections?limit=100&offset=0`,
      ).then(({ data }) => data || []),
  );

  const { data: sectionItems = [] } = useSWR(
    addOnMenuSectionId
      ? `/api/menu-sections/${addOnMenuSectionId}/menu-items?limit=100&offset=0`
      : null,
    () =>
      fetcher<{ data: MenuItemType[] }>(
        `/api/menu-sections/${addOnMenuSectionId}/menu-items?limit=100&offset=0`,
      ).then(({ data }) => data || []),
  );

  const onSubmitHandler = async ({
    addOnMenuSectionId,
    addOnMenuItemId,
  }: UpdateAddOnForm) => {
    const menuSection =
      sections.find(({ id }) => id === addOnMenuSectionId)?.name || "";
    const displayName = addOnMenuItemId
      ? tMenus("addOns.displayName.menuItem", {
          menuSection,
          menuItem:
            sectionItems.find(({ id }) => id === addOnMenuItemId)?.name || "",
        })
      : tMenus("addOns.displayName.menuSection", { menuSection });

    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuItemAddOn>(
        `/api/menu-items/${addOn.menuItemId}/add-ons/${addOn.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            addOnMenuItemId
              ? { addOnMenuSectionId: null, addOnMenuItemId }
              : { addOnMenuSectionId, addOnMenuItemId: null },
          ),
        },
      );

      enqueueSnackbar(
        tMenus("addOns.actions.updateAddOn.success", { name: displayName }),
        { variant: "success" },
      );

      closeDialog();
      mutate();
    } catch {
      enqueueSnackbar(
        tMenus("addOns.actions.updateAddOn.error", { name: displayName }),
        { variant: "error" },
      );
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-add-on-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.addOnMenuSectionId}
        fullWidth
        helperText={errors.addOnMenuSectionId?.message}
        label={tMenus("addOns.addOnMenuSectionId.label")}
        required
        select
        slotProps={{
          input: {
            endAdornment: addOnMenuSectionId && (
              <StyledInputAdornment position="end">
                <IconButton
                  onClick={() => {
                    setValue("addOnMenuSectionId", "");
                    setValue("addOnMenuItemId", "");
                  }}
                  size="small"
                >
                  <Clear fontSize="small" />
                </IconButton>
              </StyledInputAdornment>
            ),
          },
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) =>
              selected ? (
                sections.find(({ id }) => id === selected)?.name
              ) : (
                <em>{tMenus("addOns.addOnMenuSectionId.placeholder")}</em>
              ),
          },
        }}
        value={addOnMenuSectionId}
        {...register("addOnMenuSectionId", {
          onChange: () => setValue("addOnMenuItemId", ""),
        })}
      >
        <MenuItem disabled value="">
          <em>{tMenus("addOns.addOnMenuSectionId.placeholder")}</em>
        </MenuItem>
        {sections.map(({ id, name }) => (
          <MenuItem
            disabled={id !== addOnMenuSectionId && usedSectionIds.has(id)}
            key={id}
            value={id}
          >
            {name}
          </MenuItem>
        ))}
      </TextField>
      {addOnMenuSectionId && (
        <TextField
          error={!!errors.addOnMenuItemId}
          fullWidth
          helperText={errors.addOnMenuItemId?.message}
          label={`${tMenus("addOns.addOnMenuItemId.label")} ${tCommon("optional")}`}
          select
          slotProps={{
            input: {
              endAdornment: addOnMenuItemId && (
                <StyledInputAdornment position="end">
                  <IconButton
                    onClick={() => setValue("addOnMenuItemId", "")}
                    size="small"
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </StyledInputAdornment>
              ),
            },
            inputLabel: { shrink: true },
            select: {
              displayEmpty: true,
              renderValue: (selected) =>
                selected ? (
                  sectionItems.find(({ id }) => id === selected)?.name
                ) : (
                  <em>{tMenus("addOns.addOnMenuItemId.placeholder")}</em>
                ),
            },
          }}
          value={addOnMenuItemId}
          {...register("addOnMenuItemId")}
        >
          <MenuItem disabled value="">
            <em>{tMenus("addOns.addOnMenuItemId.placeholder")}</em>
          </MenuItem>
          {sectionItems.map(({ id, name }) => (
            <MenuItem
              disabled={id !== addOnMenuItemId && usedItemIds.has(id)}
              key={id}
              value={id}
            >
              {name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </FormBox>
  );
};

export default UpdateAddOnDialog;
