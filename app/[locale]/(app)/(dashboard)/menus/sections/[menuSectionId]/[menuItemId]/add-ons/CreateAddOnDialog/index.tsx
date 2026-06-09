"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import { type CreateAddOnForm, useCreateAddOnFormSchema } from "./definitions";

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
  MenuItem as MenuItemDto,
  MenuSection,
} from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

const StyledInputAdornment = styled(InputAdornment)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

interface CreateAddOnDialogProps {
  menuId: string;
  menuItemId: string;
  mutate: () => void;
}

const CreateAddOnDialog = ({
  menuId,
  menuItemId,
  mutate,
}: CreateAddOnDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const createAddOnFormSchema = useCreateAddOnFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<CreateAddOnForm>({
    defaultValues: {
      addOnMenuSectionId: "",
      addOnMenuItemId: "",
    },
    resolver: zodResolver(createAddOnFormSchema),
  });

  const addOnMenuSectionId = useWatch({ control, name: "addOnMenuSectionId" });
  const addOnMenuItemId = useWatch({ control, name: "addOnMenuItemId" });

  const { data: addOns = [] } = useSWR(
    `/api/menu-items/${menuItemId}/add-ons?limit=100&offset=0`,
    () =>
      fetcher<{
        data: MenuItemAddOn[];
        total: number;
      }>(`/api/menu-items/${menuItemId}/add-ons?limit=100&offset=0`).then(
        ({ data }) => data,
      ),
  );

  const usedSectionIds = new Set(
    addOns.flatMap(({ addOnMenuSectionId }) => addOnMenuSectionId || []),
  );
  const usedItemIds = new Set(
    addOns.flatMap(({ addOnMenuItemId }) => addOnMenuItemId || []),
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
      fetcher<{ data: MenuItemDto[] }>(
        `/api/menu-sections/${addOnMenuSectionId}/menu-items?limit=100&offset=0`,
      ).then(({ data }) => data || []),
  );

  const onSubmitHandler = async ({
    addOnMenuSectionId,
    addOnMenuItemId,
  }: CreateAddOnForm) => {
    const menuSection = localize(
      sections.find(({ id }) => id === addOnMenuSectionId)?.name,
      locale,
    );

    const displayName = addOnMenuItemId
      ? tMenus("items.addOns.displayName.menuItem", {
          menuSection,
          menuItem: localize(
            sectionItems.find(({ id }) => id === addOnMenuItemId)?.name,
            locale,
          ),
        })
      : tMenus("items.addOns.displayName.menuSection", { menuSection });

    try {
      setDialog({ confirmLoading: true });

      await fetcher<MenuItemAddOn>(`/api/menu-items/${menuItemId}/add-ons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          addOnMenuItemId ? { addOnMenuItemId } : { addOnMenuSectionId },
        ),
      });

      enqueueSnackbar(
        tMenus("items.addOns.actions.createAddOn.success", {
          name: displayName,
        }),
        { variant: "success" },
      );

      closeDialog();
      mutate();
    } catch {
      enqueueSnackbar(
        tMenus("items.addOns.actions.createAddOn.error", { name: displayName }),
        { variant: "error" },
      );
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="create-add-on-form" onSubmit={onSubmit}>
      <TextField
        error={!!errors.addOnMenuSectionId}
        fullWidth
        helperText={errors.addOnMenuSectionId?.message}
        label={tMenus("items.addOns.addOnMenuSectionId.label")}
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
                localize(
                  sections.find(({ id }) => id === selected)?.name,
                  locale,
                )
              ) : (
                <em>{tMenus("items.addOns.addOnMenuSectionId.placeholder")}</em>
              ),
          },
        }}
        value={addOnMenuSectionId}
        {...register("addOnMenuSectionId", {
          onChange: () => setValue("addOnMenuItemId", ""),
        })}
      >
        <MenuItem disabled value="">
          <em>{tMenus("items.addOns.addOnMenuSectionId.placeholder")}</em>
        </MenuItem>
        {sections.map(({ id, name }) => (
          <MenuItem disabled={usedSectionIds.has(id)} key={id} value={id}>
            {localize(name, locale)}
          </MenuItem>
        ))}
      </TextField>
      {addOnMenuSectionId && (
        <TextField
          error={!!errors.addOnMenuItemId}
          fullWidth
          helperText={errors.addOnMenuItemId?.message}
          label={`${tMenus("items.addOns.addOnMenuItemId.label")} ${tCommon("optional")}`}
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
                  localize(
                    sectionItems.find(({ id }) => id === selected)?.name,
                    locale,
                  )
                ) : (
                  <em>{tMenus("items.addOns.addOnMenuItemId.placeholder")}</em>
                ),
            },
          }}
          value={addOnMenuItemId}
          {...register("addOnMenuItemId")}
        >
          <MenuItem disabled value="">
            <em>{tMenus("items.addOns.addOnMenuItemId.placeholder")}</em>
          </MenuItem>
          {sectionItems.map(({ id, name }) => (
            <MenuItem disabled={usedItemIds.has(id)} key={id} value={id}>
              {localize(name, locale)}
            </MenuItem>
          ))}
        </TextField>
      )}
    </FormBox>
  );
};

export default CreateAddOnDialog;
