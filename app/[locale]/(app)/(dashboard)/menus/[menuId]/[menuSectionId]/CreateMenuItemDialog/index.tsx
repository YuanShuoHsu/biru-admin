"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import UploadAvatars from "@/components/UploadAvatars";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import {
  ITEM_AVAILABILITY_VALUES,
  type CreateMenuItemForm,
  useCreateMenuItemFormSchema,
} from "./definitions";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Box,
  type BoxProps,
  Divider,
  Grid,
  MenuItem,
  styled,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import CountrySelect from "@/components/CountrySelect";
import NumberSpinner from "@/components/NumberSpinner";

import { currencies, DEFAULT_CURRENCY_OPTION } from "@/constants/currencies";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { MenuItem as MenuItemType } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const CREATE_MENU_ITEM_IMAGE_KEY = "create-menu-item-image";

interface CreateMenuItemDialogProps {
  mutateItems: () => void;
  menuSectionId: string;
}

const CreateMenuItemDialog = ({
  mutateItems,
  menuSectionId,
}: CreateMenuItemDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const tMenus = useTranslations("menus");

  const imageSrc = useUploadAvatarSrc(CREATE_MENU_ITEM_IMAGE_KEY);

  const createMenuItemFormSchema = useCreateMenuItemFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<CreateMenuItemForm>({
    defaultValues: {
      name: "",
      description: "",
      offer: {
        priceCurrency: "TWD",
        price: "",
        availability: "InStock",
        inventoryLevel: { value: "", unitText: "" },
        deliveryLeadTime: { value: "", unitText: "" },
        priceSpecification: { price: "", validFrom: "", validThrough: "" },
      },
    },
    resolver: zodResolver(createMenuItemFormSchema),
  });

  const priceCurrency = useWatch({ control, name: "offer.priceCurrency" });
  const availability = useWatch({ control, name: "offer.availability" });
  const deliveryLeadTimeValue = useWatch({
    control,
    name: "offer.deliveryLeadTime.value",
  });
  const inventoryLevelValue = useWatch({
    control,
    name: "offer.inventoryLevel.value",
  });
  const priceSpecificationValidFrom = useWatch({
    control,
    name: "offer.priceSpecification.validFrom",
  });
  const priceSpecificationValidThrough = useWatch({
    control,
    name: "offer.priceSpecification.validThrough",
  });

  const buildQuantitativePayload = (qv?: {
    value?: string;
    unitText?: string;
  }) => {
    if (!qv) return null;
    const payload = {
      ...(qv.value && { value: Number(qv.value) }),
      ...(qv.unitText && { unitText: qv.unitText }),
    };
    return Object.keys(payload).length > 0 ? payload : null;
  };

  const onSubmitHandler = async ({
    name,
    description,
    offer,
  }: CreateMenuItemForm) => {
    try {
      setDialog({ confirmLoading: true });

      const created = await fetcher<MenuItemType>(
        `/api/menu-sections/${menuSectionId}/menu-items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            ...(description && { description }),
            ...(imageSrc && { image: imageSrc }),
          }),
        },
      );

      if (offer?.price) {
        await fetcher(`/api/menu-items/${created.id}/offers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceCurrency: offer.priceCurrency,
            price: offer.price,
            availability: offer.availability,
            deliveryLeadTime: buildQuantitativePayload(offer.deliveryLeadTime),
            inventoryLevel: buildQuantitativePayload(offer.inventoryLevel),
            priceSpecification: offer.priceSpecification?.price
              ? {
                  price: offer.priceSpecification.price,
                  priceCurrency: offer.priceCurrency,
                  ...(offer.priceSpecification.validFrom && {
                    validFrom: offer.priceSpecification.validFrom,
                  }),
                  ...(offer.priceSpecification.validThrough && {
                    validThrough: offer.priceSpecification.validThrough,
                  }),
                }
              : null,
          }),
        });
      }

      enqueueSnackbar(tMenus("items.actions.createItem.success", { name }), {
        variant: "success",
      });

      closeDialog();
      mutateItems();
    } catch {
      enqueueSnackbar(tMenus("items.actions.createItem.title"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <StyledBox component="form" id="create-menu-item-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        shape="square"
        uploadKey={CREATE_MENU_ITEM_IMAGE_KEY}
      />
      <TextField
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tMenus("items.name.label")}
        placeholder={tMenus("items.name.placeholder")}
        required
        {...register("name")}
      />
      <TextField
        error={!!errors.description}
        fullWidth
        helperText={errors.description?.message}
        label={tMenus("items.description.label")}
        multiline
        placeholder={tMenus("items.description.placeholder")}
        rows={3}
        {...register("description")}
      />
      <Divider flexItem />
      <Typography variant="subtitle2" alignSelf="flex-start">
        {tMenus("offers.label")}
      </Typography>
      <Grid container width="100%" spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CountrySelect
            error={!!errors.offer?.priceCurrency}
            helperText={errors.offer?.priceCurrency?.message}
            label={tMenus("offers.priceCurrency.label")}
            mode="currency"
            value={
              currencies.find(({ currency }) => currency === priceCurrency) ||
              DEFAULT_CURRENCY_OPTION
            }
            {...register("offer.priceCurrency")}
            onChange={(value) => {
              if ("currency" in value)
                setValue("offer.priceCurrency", value.currency);
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            error={!!errors.offer?.price}
            fullWidth
            helperText={errors.offer?.price?.message}
            label={tMenus("offers.price.label")}
            placeholder={tMenus("offers.price.placeholder")}
            {...register("offer.price")}
          />
        </Grid>
      </Grid>
      <TextField
        {...register("offer.availability")}
        error={!!errors.offer?.availability}
        fullWidth
        helperText={errors.offer?.availability?.message}
        label={tMenus("offers.availability.label")}
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: (selected) =>
              selected ? (
                tMenus(
                  `offers.availability.options.${selected}` as Parameters<
                    typeof tMenus
                  >[0],
                )
              ) : (
                <em>{tMenus("offers.availability.placeholder")}</em>
              ),
          },
        }}
        value={availability ?? ""}
      >
        <MenuItem disabled value="">
          <em>{tMenus("offers.availability.placeholder")}</em>
        </MenuItem>
        {ITEM_AVAILABILITY_VALUES.map((value) => (
          <MenuItem key={value} value={value}>
            {tMenus(
              `offers.availability.options.${value}` as Parameters<
                typeof tMenus
              >[0],
            )}
          </MenuItem>
        ))}
      </TextField>
      <Grid container width="100%" alignItems="flex-end" spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.offer?.inventoryLevel?.value}
            fullWidth
            helperText={errors.offer?.inventoryLevel?.value?.message}
            label={tMenus("offers.inventoryLevel.value.label")}
            min={0}
            placeholder={tMenus("offers.inventoryLevel.value.placeholder")}
            value={
              inventoryLevelValue !== "" ? Number(inventoryLevelValue) : null
            }
            onValueChange={(val) =>
              setValue(
                "offer.inventoryLevel.value",
                val != null ? String(val) : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.offer?.inventoryLevel?.unitText}
            fullWidth
            helperText={errors.offer?.inventoryLevel?.unitText?.message}
            label={tMenus("offers.inventoryLevel.unitText.label")}
            placeholder={tMenus("offers.inventoryLevel.unitText.placeholder")}
            {...register("offer.inventoryLevel.unitText")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.offer?.deliveryLeadTime?.value}
            fullWidth
            helperText={errors.offer?.deliveryLeadTime?.value?.message}
            label={tMenus("offers.deliveryLeadTime.value.label")}
            min={0}
            placeholder={tMenus("offers.deliveryLeadTime.value.placeholder")}
            value={
              deliveryLeadTimeValue !== ""
                ? Number(deliveryLeadTimeValue)
                : null
            }
            onValueChange={(val) =>
              setValue(
                "offer.deliveryLeadTime.value",
                val != null ? String(val) : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.offer?.deliveryLeadTime?.unitText}
            fullWidth
            helperText={errors.offer?.deliveryLeadTime?.unitText?.message}
            label={tMenus("offers.deliveryLeadTime.unitText.label")}
            placeholder={tMenus("offers.deliveryLeadTime.unitText.placeholder")}
            {...register("offer.deliveryLeadTime.unitText")}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            error={!!errors.offer?.priceSpecification?.price}
            fullWidth
            helperText={errors.offer?.priceSpecification?.price?.message}
            label={tMenus("offers.priceSpecification.price.label")}
            placeholder={tMenus("offers.priceSpecification.price.placeholder")}
            {...register("offer.priceSpecification.price")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={tMenus("offers.priceSpecification.validFrom.label")}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.offer?.priceSpecification?.validFrom,
                fullWidth: true,
                helperText:
                  errors.offer?.priceSpecification?.validFrom?.message,
              },
            }}
            value={
              priceSpecificationValidFrom
                ? dayjs(priceSpecificationValidFrom)
                : null
            }
            {...register("offer.priceSpecification.validFrom")}
            onChange={(date) =>
              setValue(
                "offer.priceSpecification.validFrom",
                date ? date.format("YYYY-MM-DD") : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={tMenus("offers.priceSpecification.validThrough.label")}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!errors.offer?.priceSpecification?.validThrough,
                fullWidth: true,
                helperText:
                  errors.offer?.priceSpecification?.validThrough?.message,
              },
            }}
            value={
              priceSpecificationValidThrough
                ? dayjs(priceSpecificationValidThrough)
                : null
            }
            {...register("offer.priceSpecification.validThrough")}
            onChange={(date) =>
              setValue(
                "offer.priceSpecification.validThrough",
                date ? date.format("YYYY-MM-DD") : "",
              )
            }
          />
        </Grid>
      </Grid>
    </StyledBox>
  );
};

export default CreateMenuItemDialog;
