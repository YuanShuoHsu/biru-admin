"use client";

import { type CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  type UpdateOrderCustomerForm,
  useUpdateOrderCustomerFormSchema,
} from "./definitions";

import CountryAutocomplete from "@/components/CountryAutocomplete";
import FormBox from "@/components/FormBox";
import TextMaskCustom from "@/components/TextMaskCustom";

import { zodResolver } from "@hookform/resolvers/zod";

import { Grid, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { OrderResponse } from "@/types/orders";

import { getPhoneDefaults, getPhoneFormatting } from "@/utils/countries";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const UPDATE_ORDER_CUSTOMER_FORM_ID = "update-order-customer-form";

interface UpdateOrderCustomerDialogContentProps {
  mutate: () => void;
  order: OrderResponse;
  organizationSlug: string;
}

const UpdateOrderCustomerDialogContent = ({
  mutate,
  order,
  organizationSlug,
}: UpdateOrderCustomerDialogContentProps) => {
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const updateOrderCustomerFormSchema = useUpdateOrderCustomerFormSchema();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<UpdateOrderCustomerForm>({
    defaultValues: {
      email: order.customer.email || "",
      name: order.customer.name,
      remark: order.customer.remark || "",
      ...getPhoneDefaults(order.customer.telephone, locale),
    },
    resolver: zodResolver(updateOrderCustomerFormSchema),
  });

  const [countryCode, telephone] = useWatch({
    control,
    name: ["countryCode", "telephone"],
  });

  const { mask, placeholder } = getPhoneFormatting(countryCode);

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(
      async ({
        countryCode: countryCodeValue,
        email,
        name,
        remark,
        telephone: telephoneValue,
      }) => {
        setDialog({ confirmLoading: true });

        try {
          await fetcher(
            `/api/organizations/${organizationSlug}/orders/${order.id}/customer`,
            {
              body: JSON.stringify({
                email: email || undefined,
                name,
                remark: remark || undefined,
                telephone: telephoneValue
                  ? parsePhoneNumberWithError(
                      telephoneValue,
                      countryCodeValue as CountryCode,
                    ).number
                  : undefined,
              }),
              headers: { "Content-Type": "application/json" },
              method: "PATCH",
            },
          );

          enqueueSnackbar(
            tOrders("actions.updateCustomer.success", {
              orderNumber: order.orderNumber,
            }),
            { variant: "success" },
          );

          closeDialog();

          mutate();
        } catch (error) {
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
        } finally {
          setDialog({ confirmLoading: false });
        }
      },
    )(event);

  return (
    <FormBox id={UPDATE_ORDER_CUSTOMER_FORM_ID} onSubmit={onSubmit}>
      <TextField
        autoComplete="name"
        error={!!errors.name}
        fullWidth
        helperText={errors.name?.message}
        label={tOrder("checkout.customer.name.label")}
        placeholder={tOrder("checkout.customer.name.placeholder")}
        required
        {...register("name")}
      />
      <Grid container spacing={2} width="100%">
        <Grid size={{ xs: 12, sm: 6 }}>
          <CountryAutocomplete
            error={!!errors.countryCode}
            helperText={errors.countryCode?.message}
            label={tOrder("checkout.customer.countryCode.label")}
            mode="country"
            placeholder={tOrder("checkout.customer.countryCode.placeholder")}
            required
            value={countryCode}
            {...register("countryCode")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            autoComplete="tel"
            error={!!errors.telephone}
            fullWidth
            helperText={errors.telephone?.message}
            label={`${tOrder("checkout.customer.telephone.label")} ${tCommon("optional")}`}
            slotProps={{
              input: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                inputComponent: TextMaskCustom as any,
                inputProps: { mask, placeholder },
              },
            }}
            type="tel"
            value={telephone}
            {...register("telephone")}
          />
        </Grid>
      </Grid>
      <TextField
        autoComplete="email"
        error={!!errors.email}
        fullWidth
        helperText={errors.email?.message}
        label={`${tOrder("checkout.customer.email.label")} ${tCommon("optional")}`}
        placeholder={tOrder("checkout.customer.email.placeholder")}
        type="email"
        {...register("email")}
      />
      <TextField
        error={!!errors.remark}
        fullWidth
        helperText={errors.remark?.message}
        label={`${tOrder("checkout.customer.remark.label")} ${tCommon("optional")}`}
        maxRows={4}
        multiline
        placeholder={tOrder("checkout.customer.remark.placeholder")}
        slotProps={{ htmlInput: { maxLength: 160 } }}
        {...register("remark")}
      />
    </FormBox>
  );
};

export default UpdateOrderCustomerDialogContent;
