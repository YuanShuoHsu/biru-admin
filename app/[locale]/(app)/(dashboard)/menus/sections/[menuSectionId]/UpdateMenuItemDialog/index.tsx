"use client";

import dayjs from "dayjs";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { NumericFormat } from "react-number-format";

import {
  type UpdateMenuItemForm,
  useUpdateMenuItemFormSchema,
} from "./definitions";

import CountrySelect from "@/components/CountrySelect";
import FormBox from "@/components/FormBox";
import LocalizedTextFields from "@/components/LocalizedTextFields";
import NumberSpinner from "@/components/NumberSpinner";
import UploadAvatars from "@/components/UploadAvatars";

import { zodResolver } from "@hookform/resolvers/zod";

import { useUploadAvatarSrc } from "@/hooks/useUploadAvatarSrc";

import { Chip, Divider, Grid, MenuItem, TextField } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { itemAvailabilityValues } from "@/types/api";
import type { MenuItem as MenuItemType } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import { localize } from "@/utils/locale";

interface UpdateMenuItemDialogProps {
  item: MenuItemType;
  mutate: () => void;
}

const UpdateMenuItemDialog = ({ item, mutate }: UpdateMenuItemDialogProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tMenus = useTranslations("menus");

  const uploadKey = `update-menu-item-image-${item.id}`;
  const imageSrc = useUploadAvatarSrc(uploadKey, item.image);

  const updateMenuItemFormSchema = useUpdateMenuItemFormSchema();
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setValue,
  } = useForm<UpdateMenuItemForm>({
    defaultValues: {
      name: item.name,
      description: item.description || {},
      offer: {
        priceCurrency: item.offer?.priceCurrency || "TWD",
        price: item.offer?.price || "",
        availability: item.offer?.availability || "InStock",
        inventoryLevel: {
          value:
            item.offer?.inventoryLevel?.value != null
              ? String(item.offer.inventoryLevel.value)
              : "",
          unitText: item.offer?.inventoryLevel?.unitText || "",
        },
        deliveryLeadTime: {
          value:
            item.offer?.deliveryLeadTime?.value != null
              ? String(item.offer.deliveryLeadTime.value)
              : "",
          unitText: item.offer?.deliveryLeadTime?.unitText || "",
        },
        priceSpecification: {
          price: item.offer?.priceSpecification?.price || "",
          validFrom: item.offer?.priceSpecification?.validFrom || "",
          validThrough: item.offer?.priceSpecification?.validThrough || "",
        },
      },
    },
    resolver: zodResolver(updateMenuItemFormSchema),
  });

  const nameValue = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });
  const priceCurrency = useWatch({ control, name: "offer.priceCurrency" });
  const price = useWatch({ control, name: "offer.price" });
  const priceSpecificationPrice = useWatch({
    control,
    name: "offer.priceSpecification.price",
  });
  const availability = useWatch({ control, name: "offer.availability" });
  const deliveryLeadTimeValue = useWatch({
    control,
    name: "offer.deliveryLeadTime.value",
  });
  const inventoryLevel = useWatch({
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

  const onSubmitHandler = async ({
    name,
    description,
    offer,
  }: UpdateMenuItemForm) => {
    try {
      setDialog({ confirmLoading: true });

      await fetcher(`/api/menu-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          image: imageSrc || null,
          offer: {
            priceCurrency: offer?.priceCurrency,
            price: offer?.price,
            availability: offer?.availability,
            deliveryLeadTime:
              offer?.deliveryLeadTime?.value ||
              offer?.deliveryLeadTime?.unitText
                ? {
                    ...(offer.deliveryLeadTime.value && {
                      value: Number(offer.deliveryLeadTime.value),
                    }),
                    ...(offer.deliveryLeadTime.unitText && {
                      unitText: offer.deliveryLeadTime.unitText,
                    }),
                  }
                : null,
            inventoryLevel:
              offer?.inventoryLevel?.value || offer?.inventoryLevel?.unitText
                ? {
                    ...(offer.inventoryLevel.value && {
                      value: Number(offer.inventoryLevel.value),
                    }),
                    ...(offer.inventoryLevel.unitText && {
                      unitText: offer.inventoryLevel.unitText,
                    }),
                  }
                : null,
            priceSpecification: offer?.priceSpecification?.price
              ? {
                  price: offer.priceSpecification.price,
                  priceCurrency: offer?.priceCurrency,
                  ...(offer.priceSpecification.validFrom && {
                    validFrom: offer.priceSpecification.validFrom,
                  }),
                  ...(offer.priceSpecification.validThrough && {
                    validThrough: offer.priceSpecification.validThrough,
                  }),
                }
              : null,
          },
        }),
      });

      enqueueSnackbar(
        tMenus("items.actions.updateItem.success", {
          name: localize(name, locale),
        }),
        {
          variant: "success",
        },
      );

      closeDialog();
      mutate();
    } catch {
      enqueueSnackbar(tMenus("items.actions.updateItem.error"), {
        variant: "error",
      });

      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id="update-menu-item-form" onSubmit={onSubmit}>
      <UploadAvatars
        aspectRatio="16/9"
        fullWidth
        initialSrc={item.image}
        shape="square"
        uploadKey={uploadKey}
      />
      <LocalizedTextFields
        fields={(lang) => [
          {
            error: !!errors.name?.[lang],
            fullWidth: true,
            helperText: errors.name?.[lang]?.message,
            label: tMenus("items.name.label"),
            onChange: (event) =>
              setValue("name", { ...nameValue, [lang]: event.target.value }),
            placeholder: tMenus("items.name.placeholder"),
            required: true,
            value: nameValue?.[lang] || "",
          },
          {
            error: !!errors.description?.[lang],
            fullWidth: true,
            helperText: errors.description?.[lang]?.message,
            label: `${tMenus("items.description.label")} ${tCommon("optional")}`,
            maxRows: 4,
            multiline: true,
            onChange: (event) =>
              setValue("description", {
                ...description,
                [lang]: event.target.value,
              }),
            placeholder: tMenus("items.description.placeholder"),
            slotProps: { htmlInput: { maxLength: 160 } },
            value: description?.[lang] || "",
          },
        ]}
      />
      <Divider flexItem>
        <Chip label={tMenus("items.offers.label")} size="small" />
      </Divider>
      <Grid container width="100%" spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <CountrySelect
            error={!!errors.offer?.priceCurrency}
            helperText={errors.offer?.priceCurrency?.message}
            label={tMenus("items.offers.priceCurrency.label")}
            mode="currency"
            placeholder={tMenus("items.offers.priceCurrency.placeholder")}
            required
            value={priceCurrency || ""}
            {...register("offer.priceCurrency")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumericFormat
            allowNegative={false}
            customInput={TextField}
            decimalScale={2}
            error={!!errors.offer?.price}
            fullWidth
            helperText={errors.offer?.price?.message}
            isAllowed={({ floatValue }) =>
              floatValue === undefined || floatValue <= 99999999.99
            }
            label={tMenus("items.offers.price.label")}
            name="offer.price"
            onBlur={register("offer.price").onBlur}
            onValueChange={({ value }) => setValue("offer.price", value)}
            placeholder={tMenus("items.offers.price.placeholder")}
            required
            thousandSeparator=","
            value={price}
            valueIsNumericString
          />
        </Grid>
      </Grid>
      <TextField
        {...register("offer.availability")}
        error={!!errors.offer?.availability}
        fullWidth
        helperText={errors.offer?.availability?.message}
        label={tMenus("availability.label")}
        required
        select
        slotProps={{
          inputLabel: { shrink: true },
          select: {
            displayEmpty: true,
            renderValue: () =>
              availability ? (
                tMenus(`availability.options.${availability}`)
              ) : (
                <em>{tMenus("availability.placeholder")}</em>
              ),
          },
        }}
        value={availability}
      >
        <MenuItem disabled value="">
          <em>{tMenus("availability.placeholder")}</em>
        </MenuItem>
        {itemAvailabilityValues.map((value) => (
          <MenuItem key={value} value={value}>
            {tMenus(`availability.options.${value}`)}
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
            label={`${tMenus("items.offers.inventoryLevel.value.label")} ${tCommon("optional")}`}
            min={0}
            placeholder={tMenus(
              "items.offers.inventoryLevel.value.placeholder",
            )}
            value={inventoryLevel !== "" ? Number(inventoryLevel) : null}
            onValueChange={(value) =>
              setValue(
                "offer.inventoryLevel.value",
                value != null ? String(value) : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.offer?.inventoryLevel?.unitText}
            fullWidth
            helperText={errors.offer?.inventoryLevel?.unitText?.message}
            label={`${tMenus("items.offers.inventoryLevel.unitText.label")} ${tCommon("optional")}`}
            placeholder={tMenus(
              "items.offers.inventoryLevel.unitText.placeholder",
            )}
            {...register("offer.inventoryLevel.unitText")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberSpinner
            clearable
            error={!!errors.offer?.deliveryLeadTime?.value}
            fullWidth
            helperText={errors.offer?.deliveryLeadTime?.value?.message}
            label={`${tMenus("items.offers.deliveryLeadTime.value.label")} ${tCommon("optional")}`}
            min={0}
            placeholder={tMenus(
              "items.offers.deliveryLeadTime.value.placeholder",
            )}
            value={
              deliveryLeadTimeValue !== ""
                ? Number(deliveryLeadTimeValue)
                : null
            }
            onValueChange={(value) =>
              setValue(
                "offer.deliveryLeadTime.value",
                value != null ? String(value) : "",
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            error={!!errors.offer?.deliveryLeadTime?.unitText}
            fullWidth
            helperText={errors.offer?.deliveryLeadTime?.unitText?.message}
            label={`${tMenus("items.offers.deliveryLeadTime.unitText.label")} ${tCommon("optional")}`}
            placeholder={tMenus(
              "items.offers.deliveryLeadTime.unitText.placeholder",
            )}
            {...register("offer.deliveryLeadTime.unitText")}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <NumericFormat
            allowNegative={false}
            customInput={TextField}
            decimalScale={2}
            error={!!errors.offer?.priceSpecification?.price}
            fullWidth
            helperText={errors.offer?.priceSpecification?.price?.message}
            isAllowed={({ floatValue }) =>
              floatValue === undefined || floatValue <= 99999999.99
            }
            label={`${tMenus("items.offers.priceSpecification.price.label")} ${tCommon("optional")}`}
            name="offer.priceSpecification.price"
            onBlur={register("offer.priceSpecification.price").onBlur}
            onValueChange={({ value }) =>
              setValue("offer.priceSpecification.price", value)
            }
            placeholder={tMenus(
              "items.offers.priceSpecification.price.placeholder",
            )}
            thousandSeparator=","
            value={priceSpecificationPrice}
            valueIsNumericString
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={`${tMenus("items.offers.priceSpecification.validFrom.label")} ${tCommon("optional")}`}
            maxDate={
              priceSpecificationValidThrough
                ? dayjs(priceSpecificationValidThrough)
                : undefined
            }
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
            label={`${tMenus("items.offers.priceSpecification.validThrough.label")} ${tCommon("optional")}`}
            minDate={
              priceSpecificationValidFrom
                ? dayjs(priceSpecificationValidFrom)
                : undefined
            }
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
    </FormBox>
  );
};

export default UpdateMenuItemDialog;
