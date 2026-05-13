"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  ADD_ON_TYPE_VALUES,
  type CreateAddOnForm,
  useCreateAddOnFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import { Box, type BoxProps, MenuItem, styled, TextField } from "@mui/material";
import useSWR from "swr";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  MenuItemAddOn,
  MenuSection,
  MenuItem as MenuItemType,
} from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

interface CreateAddOnDialogProps {
  menuId: string;
  menuItemId: string;
  mutateAddOns: () => void;
}

const CreateAddOnDialog = ({
  menuId,
  menuItemId,
  mutateAddOns,
}: CreateAddOnDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const createAddOnFormSchema = useCreateAddOnFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    watch,
    setValue,
  } = useForm<CreateAddOnForm>({
    defaultValues: {
      type: "item",
      sectionId: "",
      addOnMenuItemId: "",
      addOnMenuSectionId: "",
    },
    resolver: zodResolver(createAddOnFormSchema),
  });

  const selectedType = watch("type");
  const selectedSectionId = watch("sectionId");

  const { data: sections = [] } = useSWR(
    `/api/menus/${menuId}/menu-sections?limit=100&offset=0`,
    () =>
      fetcher<{ data: MenuSection[] }>(
        `/api/menus/${menuId}/menu-sections?limit=100&offset=0`,
      ).then((r) => r.data ?? []),
  );

  const { data: sectionItems = [] } = useSWR(
    selectedType === "item" && selectedSectionId
      ? `/api/menu-sections/${selectedSectionId}/menu-items?limit=100&offset=0`
      : null,
    () =>
      fetcher<{ data: MenuItemType[] }>(
        `/api/menu-sections/${selectedSectionId}/menu-items?limit=100&offset=0`,
      ).then((r) => r.data ?? []),
  );

  useEffect(() => {
    setValue("addOnMenuItemId", "");
    setValue("addOnMenuSectionId", "");
    setValue("sectionId", "");
  }, [selectedType, setValue]);

  useEffect(() => {
    setValue("addOnMenuItemId", "");
  }, [selectedSectionId, setValue]);

  const onSubmitHandler = async ({
    type,
    addOnMenuItemId,
    addOnMenuSectionId,
  }: CreateAddOnForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuItemAddOn>(`/api/menu-items/${menuItemId}/add-ons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          type === "item" ? { addOnMenuItemId } : { addOnMenuSectionId },
        ),
      });

      enqueueSnackbar(tMenus("addOns.actions.createAddOn.success"), {
        variant: "success",
      });

      closeDialog();
      mutateAddOns();
    } catch {
      enqueueSnackbar(tMenus("addOns.actions.createAddOn.title"), {
        variant: "error",
      });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="create-add-on-form" onSubmit={onSubmit}>
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <TextField
            {...field}
            error={!!errors.type}
            fullWidth
            helperText={errors.type?.message}
            label={tMenus("addOns.type.label")}
            required
            select
          >
            {ADD_ON_TYPE_VALUES.map((value) => (
              <MenuItem key={value} value={value}>
                {tMenus(`addOns.type.${value}` as Parameters<typeof tMenus>[0])}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name="sectionId"
        render={({ field }) => (
          <TextField
            {...field}
            error={
              selectedType === "section"
                ? !!errors.addOnMenuSectionId
                : !!errors.sectionId
            }
            fullWidth
            helperText={
              selectedType === "section"
                ? errors.addOnMenuSectionId?.message
                : errors.sectionId?.message
            }
            label={
              selectedType === "section"
                ? tMenus("addOns.addOnMenuSectionId.label")
                : tMenus("sections.name.label")
            }
            required
            select
            onChange={(e) => {
              field.onChange(e);
              if (selectedType === "section") {
                setValue("addOnMenuSectionId", e.target.value);
              }
            }}
          >
            {sections.map((section) => (
              <MenuItem key={section.id} value={section.id}>
                {section.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      {selectedType === "item" && selectedSectionId && (
        <Controller
          control={control}
          name="addOnMenuItemId"
          render={({ field }) => (
            <TextField
              {...field}
              error={!!errors.addOnMenuItemId}
              fullWidth
              helperText={errors.addOnMenuItemId?.message}
              label={tMenus("addOns.addOnMenuItemId.label")}
              required
              select
            >
              {sectionItems.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      )}
    </StyledBox>
  );
};

export default CreateAddOnDialog;
