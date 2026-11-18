"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";

import {
  type ProductWasteFormInput,
  type ProductWasteFormOutput,
  useProductWasteFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";
import NumberSpinner from "@/components/NumberSpinner";

import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api-client";

import { Autocomplete, MenuItem, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { wasteReasonValues } from "@/types/api";
import type { Ingredient } from "@/types/inventory";
import type { OrderMenu } from "@/types/menus";

import { getErrorMessage } from "@/utils/errors";
import type { FetchError } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

type ShortfallError = FetchError & {
  info?: { ingredients?: Pick<Ingredient, "id" | "name">[] };
};

interface ProductWasteDialogProps {
  mutate: () => void;
  organizationId: string;
  organizationSlug: string;
}

const ProductWasteDialog = ({
  mutate,
  organizationId,
  organizationSlug,
}: ProductWasteDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tInventory = useTranslations("inventory");

  const productWasteFormSchema = useProductWasteFormSchema();
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<ProductWasteFormInput, unknown, ProductWasteFormOutput>({
    defaultValues: {
      menuItemId: "",
      modifierIds: [],
      note: "",
      servings: "1",
      wasteReason: "",
    },
    resolver: zodResolver(productWasteFormSchema),
  });

  const menuItemId = useWatch({ control, name: "menuItemId" });
  const modifierIds = useWatch({ control, name: "modifierIds" });
  const servings = useWatch({ control, name: "servings" });
  const wasteReason = useWatch({ control, name: "wasteReason" });

  const { data: menu = null, isLoading } = useSWR<OrderMenu | null>(
    organizationId
      ? `/api/organizations/${organizationId}/order-menu?lang=${locale}`
      : null,
  );

  const itemOptions = (menu?.sections || []).flatMap(({ menuItems, name }) =>
    menuItems.map((item) => ({ ...item, section: name })),
  );
  const menuItem = itemOptions.find(({ id }) => id === menuItemId) || null;
  const modifierOptions = (menuItem?.modifierGroups || []).flatMap(
    ({ displayName, modifiers }) =>
      modifiers.map((modifier) => ({ ...modifier, group: displayName })),
  );

  const onSubmitHandler = async (values: ProductWasteFormOutput) => {
    try {
      setDialog({ confirmLoading: true });

      await apiClient.POST(
        "/api/organizations/{organizationSlug}/inventory/waste",
        {
          params: { path: { organizationSlug } },
          body: {
            menuItemId: values.menuItemId,
            modifierIds: values.modifierIds,
            note: values.note || null,
            servings: Number(values.servings),
            wasteReason: values.wasteReason,
          },
        },
      );

      enqueueSnackbar(
        tInventory("ingredients.actions.recordProductWaste.success", {
          name: menuItem?.name ?? "",
        }),
        { variant: "success" },
      );

      closeDialog();

      mutate();
    } catch (error) {
      const shortfalls = (error as ShortfallError).info?.ingredients;

      if (shortfalls?.length)
        setError("servings", {
          message: tInventory(
            "ingredients.actions.recordProductWaste.shortfall",
            {
              names: shortfalls
                .map(({ name }) => localize(name, locale))
                .join(tCommon("delimiter")),
            },
          ),
        });
      else enqueueSnackbar(getErrorMessage(error), { variant: "error" });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="product-waste-form" onSubmit={onSubmit}>
      <Autocomplete
        fullWidth
        getOptionKey={({ id }) => id}
        getOptionLabel={({ name }) => name}
        groupBy={({ section }) => section}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={isLoading}
        onChange={(_, value) => {
          setValue("menuItemId", value?.id ?? "", {
            shouldValidate: isSubmitted,
          });
          setValue("modifierIds", []);
        }}
        options={itemOptions}
        renderInput={(params) => (
          <TextField
            {...params}
            error={!!errors.menuItemId}
            helperText={errors.menuItemId?.message}
            label={tInventory(
              "ingredients.actions.recordProductWaste.menuItemId.label",
            )}
            placeholder={tInventory(
              "ingredients.actions.recordProductWaste.menuItemId.placeholder",
            )}
            required
          />
        )}
        value={menuItem}
      />
      {modifierOptions.length > 0 && (
        <Autocomplete
          fullWidth
          getOptionKey={({ id }) => id}
          getOptionLabel={({ displayName }) => displayName}
          groupBy={({ group }) => group}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          multiple
          onChange={(_, value) =>
            setValue(
              "modifierIds",
              value.map(({ id }) => id),
            )
          }
          options={modifierOptions}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`${tInventory("ingredients.actions.recordProductWaste.modifierIds.label")} ${tCommon("optional")}`}
              placeholder={tInventory(
                "ingredients.actions.recordProductWaste.modifierIds.placeholder",
              )}
            />
          )}
          value={modifierOptions.filter(({ id }) => modifierIds.includes(id))}
        />
      )}
      <NumberSpinner
        error={!!errors.servings}
        fullWidth
        helperText={errors.servings?.message}
        label={tInventory(
          "ingredients.actions.recordProductWaste.servings.label",
        )}
        max={9999}
        min={1}
        onValueChange={(value) =>
          setValue("servings", value != null ? String(value) : "", {
            shouldValidate: isSubmitted,
          })
        }
        placeholder={tInventory(
          "ingredients.actions.recordProductWaste.servings.placeholder",
        )}
        required
        value={servings ? Number(servings) : null}
      />
      <TextField
        error={!!errors.wasteReason}
        fullWidth
        helperText={errors.wasteReason?.message}
        label={tInventory("transactions.wasteReason.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) => {
              const value = wasteReasonValues.find(
                (reason) => reason === selected,
              );

              return value ? (
                tInventory(`transactions.wasteReason.options.${value}`)
              ) : (
                <em>{tInventory("transactions.wasteReason.placeholder")}</em>
              );
            },
          },
        }}
        value={wasteReason}
        {...register("wasteReason")}
      >
        <MenuItem disabled value="">
          <em>{tInventory("transactions.wasteReason.placeholder")}</em>
        </MenuItem>
        {wasteReasonValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tInventory(`transactions.wasteReason.options.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        error={!!errors.note}
        fullWidth
        helperText={errors.note?.message}
        label={`${tInventory("ingredients.transactionNote.label")} ${tCommon("optional")}`}
        placeholder={tInventory("ingredients.transactionNote.placeholder")}
        {...register("note")}
      />
    </FormBox>
  );
};

export default ProductWasteDialog;
