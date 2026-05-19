"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import { type UpdateAddOnForm, useUpdateAddOnFormSchema } from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { Box, type BoxProps, MenuItem, styled, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  MenuItemAddOn,
  MenuItem as MenuItemType,
  MenuSection,
} from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface UpdateAddOnDialogProps {
  addOn: MenuItemAddOn;
  menuId: string;
  mutateAddOns: () => void;
}

const UpdateAddOnDialog = ({
  addOn,
  menuId,
  mutateAddOns,
}: UpdateAddOnDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

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
    const name =
      (addOnMenuItemId
        ? sectionItems.find(({ id }) => id === addOnMenuItemId)?.name
        : sections.find(({ id }) => id === addOnMenuSectionId)?.name) || "";

    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuItemAddOn>(`/api/menu-item-add-ons/${addOn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          addOnMenuItemId ? { addOnMenuItemId } : { addOnMenuSectionId },
        ),
      });

      enqueueSnackbar(
        tMenus(
          addOnMenuItemId
            ? "addOns.actions.updateAddOn.success.menuItem"
            : "addOns.actions.updateAddOn.success.menuSection",
          { name },
        ),
        { variant: "success" },
      );

      closeDialog();
      mutateAddOns();
    } catch {
      enqueueSnackbar(
        tMenus(
          addOnMenuItemId
            ? "addOns.actions.updateAddOn.error.menuItem"
            : "addOns.actions.updateAddOn.error.menuSection",
          { name },
        ),
        { variant: "error" },
      );
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="update-add-on-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.addOnMenuSectionId}
        fullWidth
        helperText={errors.addOnMenuSectionId?.message}
        label={tMenus("addOns.addOnMenuSectionId.label")}
        required
        select
        slotProps={{
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
        {sections.map((section) => (
          <MenuItem key={section.id} value={section.id}>
            {section.name}
          </MenuItem>
        ))}
      </TextField>
      {addOnMenuSectionId && (
        <TextField
          error={!!errors.addOnMenuItemId}
          fullWidth
          helperText={errors.addOnMenuItemId?.message}
          label={tMenus("addOns.addOnMenuItemId.label")}
          select
          slotProps={{
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
          {sectionItems.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </StyledBox>
  );
};

export default UpdateAddOnDialog;
