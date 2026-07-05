"use client";

import { type CountryCode, parsePhoneNumberWithError } from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import {
  type CarrierType,
  type CustomerPaymentFormValues,
  type InvoiceType,
  useCustomerPaymentFormSchema,
} from "./definitions";

import CountrySelect from "@/components/CountrySelect";
import CustomizedAccordions from "@/components/CustomizedAccordions";
import DonateCodeSelect from "@/components/DonateCodeSelect";
import FormBox from "@/components/FormBox";
import { StyledCardContent } from "@/components/FormCard";
import ListRadioGroup from "@/components/ListRadioGroup";
import TextMaskCustom from "@/components/TextMaskCustom";

import { localeConfigs } from "@/constants/locale";
import { ORDER_MODE } from "@/constants/orderMode";

import { zodResolver } from "@hookform/resolvers/zod";

import useCartHasInvalidItems from "@/hooks/useCartHasInvalidItems";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  Business,
  CreditCard,
  Payments,
  Person,
  ShoppingCart,
  TaskAlt,
  VolunteerActivism,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import type { CheckoutEcpayDto, CheckoutEcpayResponse } from "@/types/ecpay";
import type { CreateOrderDto, OrderResponse } from "@/types/orders";
import type { PaymentMethod } from "@/types/payment";

import { getPhoneFormatting } from "@/utils/countries";
import { getErrorMessage } from "@/utils/errors";
import { sendRequest } from "@/utils/fetcher";
import { getChoiceNames, getItemName } from "@/utils/menus";

const PaymentImage = ({ method }: { method: PaymentMethod }) => (
  <Image
    alt={method}
    height={20}
    src={`/icons/payment/${method}.svg`}
    style={{ objectFit: "contain" }}
    unoptimized
    width={20}
  />
);

const INVOICE_TYPES: { icon: React.ElementType; type: InvoiceType }[] = [
  { icon: Person, type: "personal" },
  { icon: Business, type: "company" },
  { icon: VolunteerActivism, type: "donate" },
];

const CARRIER_TYPES: CarrierType[] = ["individual", "mobile", "certificate"];

const API_ORDER_MODE: Record<string, CreateOrderDto["mode"]> = {
  [ORDER_MODE.Counter]: "counter",
  [ORDER_MODE.DineIn]: "dineIn",
  [ORDER_MODE.Kiosk]: "kiosk",
  [ORDER_MODE.Pickup]: "pickup",
};

const OrderModeOrganizationSlugCheckout = () => {
  const { cartItemsList, clearCart, isCartEmpty } = useCartStore(
    (state) => state,
  );
  const { menu } = useMenuStore((state) => state);

  const hasInvalidItems = useCartHasInvalidItems();

  const { enqueueSnackbar } = useSnackbar();

  const customerPaymentFormSchema = useCustomerPaymentFormSchema();

  const locale = useLocale();

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setError,
    setValue,
    trigger: triggerValidation,
  } = useForm<CustomerPaymentFormValues>({
    defaultValues: {
      customer: {
        countryCode: localeConfigs[locale].countryCode,
        email: "",
        name: "",
        remark: "",
        telephone: "",
      },
      invoice: {
        carrierType: "",
        carruerNum: "",
        customerAddr: "",
        customerIdentifier: "",
        customerName: "",
        donateCode: "",
        email: "",
        emailSameAsCustomer: true,
        type: null,
      },
      payment: null,
    },
    resolver: zodResolver(customerPaymentFormSchema),
  });

  const [
    countryCode,
    carrierType,
    customerIdentifier,
    donateCode,
    invoiceType,
    payment,
  ] = useWatch({
    control,
    name: [
      "customer.countryCode",
      "invoice.carrierType",
      "invoice.customerIdentifier",
      "invoice.donateCode",
      "invoice.type",
      "payment",
    ],
  });

  const { mask, placeholder } = getPhoneFormatting(countryCode);

  const { mode, organizationSlug } = useParams();
  const isKiosk = mode === ORDER_MODE.Kiosk;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  // const isDineIn = mode === ORDER_MODE.DineIn;

  const router = useRouter();

  const { isMutating: isMutatingEcpay, trigger: triggerEcpay } = useSWRMutation(
    "/api/ecpay",
    sendRequest<CheckoutEcpayResponse, CheckoutEcpayDto>(),
  );

  const { isMutating: isMutatingOrder, trigger: triggerOrder } = useSWRMutation(
    `/api/organizations/${String(organizationSlug)}/orders`,
    sendRequest<OrderResponse, CreateOrderDto>(),
  );

  const shouldFetch =
    invoiceType === "company" && /^\d{8}$/.test(customerIdentifier);

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tValidation = useTranslations("validation");

  const { data: businessInfo } = useSWR<{
    address: string;
    name: string;
  }>(shouldFetch ? `/api/gcis/${customerIdentifier}` : null, {
    onError: () => {
      setError("invoice.customerIdentifier", {
        message: tValidation("customerIdentifier.notFound"),
      });
    },
    onSuccess: (data) => {
      setValue("invoice.customerAddr", data.address, {
        shouldValidate: isSubmitted,
      });
      setValue("invoice.customerName", data.name, {
        shouldValidate: isSubmitted,
      });
    },
  });

  const paymentOptions = [
    {
      ...(mode === ORDER_MODE.Pickup && {
        disabled: true,
        disabledReason: tOrder("checkout.payment.dineInOnly"),
      }),
      icon: <Payments fontSize="small" />,
      id: "Cash",
      label: tOrder("checkout.payment.Cash"),
    },
    {
      icon: <CreditCard fontSize="small" />,
      id: "Credit",
      label: tOrder("checkout.payment.Credit"),
    },
    {
      icon: <PaymentImage method="ApplePay" />,
      id: "ApplePay",
      label: tOrder("checkout.payment.ApplePay"),
    },
    {
      icon: <PaymentImage method="TWQR" />,
      id: "TWQR",
      label: tOrder("checkout.payment.TWQR"),
    },
    {
      icon: <PaymentImage method="WeiXin" />,
      id: "WeiXin",
      label: tOrder("checkout.payment.WeiXin"),
    },
    {
      icon: <PaymentImage method="iPASS" />,
      id: "iPASS",
      label: tOrder("checkout.payment.iPASS"),
    },
    {
      icon: <PaymentImage method="Jkopay" />,
      id: "Jkopay",
      label: tOrder("checkout.payment.Jkopay"),
    },
  ];

  const onSubmit = handleSubmit(async (values) => {
    if (!values.payment) return;

    try {
      const order = await triggerOrder({
        customer: {
          email: values.customer.email || undefined,
          name: values.customer.name,
          remark: values.customer.remark || undefined,
          telephone: values.customer.telephone
            ? parsePhoneNumberWithError(
                values.customer.telephone,
                values.customer.countryCode as CountryCode,
              ).number
            : undefined,
        },
        items: cartItemsList.map(
          ({ addOns, menuItemId, modifiers, quantity }) => ({
            addOns: addOns.map(({ id, modifiers: addOnModifiers }) => ({
              menuItemId: id,
              modifiers: addOnModifiers,
            })),
            menuItemId,
            modifiers,
            quantity,
          }),
        ),
        mode: API_ORDER_MODE[String(mode)],
        payment: values.payment,
      });

      clearCart();

      const completeSearchParams = new URLSearchParams(search);
      completeSearchParams.set("orderId", order.id);
      const completePath = `${pathname.replace("/checkout", "/complete")}?${completeSearchParams}`;

      if (values.payment === "Cash") {
        router.replace(completePath);

        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL;
      const completeUrl = `${baseUrl}/${locale}${completePath}`;
      const OrderResultURL = `${process.env.NEXT_PUBLIC_NEST_URL}/api/ecpay/result?redirect=${encodeURIComponent(completeUrl)}`;

      // const buildInvoice = (): CreateEcpayDto["invoice"] => {
      //   const common = {
      //     CustomerEmail: values.invoice.emailSameAsCustomer
      //       ? values.customer.email
      //       : values.invoice.email,
      //     CustomerName: values.customer.name,
      //     CustomerPhone: values.customer.telephone,
      //     DelayDay: "0",
      //     Donation: "0",
      //     InvType: "07",
      //     TaxType: "1",
      //   };
      //   switch (values.invoice.type) {
      //     case "personal":
      //       if (values.invoice.carrierType === "mobile") {
      //         return {
      //           ...common,
      //           CarruerNum: values.invoice.carruerNum,
      //           CarruerType: "3",
      //           Print: "0",
      //         };
      //       }
      //       if (values.invoice.carrierType === "certificate") {
      //         return {
      //           ...common,
      //           CarruerNum: values.invoice.carruerNum,
      //           CarruerType: "2",
      //           Print: "0",
      //         };
      //       }
      //       return { ...common, CarruerType: "", Donation: "0", Print: "0" };
      //     case "company":
      //       return {
      //         ...common,
      //         CarruerType: "",
      //         CustomerAddr: values.invoice.customerAddr,
      //         CustomerIdentifier: values.invoice.customerIdentifier,
      //         CustomerName: values.invoice.customerName,
      //         Print: "1",
      //       };
      //     case "donate":
      //       return {
      //         ...common,
      //         CarruerType: "",
      //         Donation: "1",
      //         LoveCode: values.invoice.donateCode,
      //         Print: "0",
      //       };
      //   }
      // };

      const dto: CheckoutEcpayDto = {
        ClientBackURL: completeUrl,
        ItemName: cartItemsList
          .map(({ menuItemId, modifiers, addOns, quantity }) => {
            const itemName = getItemName(menu, menuItemId);
            const choiceNames = getChoiceNames(
              menu,
              menuItemId,
              modifiers,
              addOns,
              {
                addOnLabel: tOrder("menuItem.addOn"),
                colon: tCommon("colon"),
                delimiter: tCommon("delimiter"),
                parenthesisOpen: tCommon("parenthesisOpen"),
                parenthesisClose: tCommon("parenthesisClose"),
              },
            );
            const formattedChoices = choiceNames ? `[${choiceNames}]` : "";

            return `${itemName} ${formattedChoices} ${tCommon("multiply")} ${quantity}`;
          })
          .join("#"),
        Language: localeConfigs[locale].ecpayLanguage,
        orderId: order.id,
        OrderResultURL,
        TradeDesc: tOrder("checkout.tradeDesc"),
      };

      const { action, fields } = await triggerEcpay(dto);

      const form = document.createElement("form");
      form.method = "POST";
      form.action = action;
      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }
  });

  return (
    <FormBox onSubmit={onSubmit}>
      <CustomizedAccordions defaultExpanded={false} />
      <Card variant="outlined">
        <StyledCardContent>
          <Typography
            alignSelf="flex-start"
            color="text.secondary"
            fontWeight="bold"
            variant="subtitle2"
          >
            {tOrder("checkout.title")}
          </Typography>
          <TextField
            error={!!errors.customer?.name}
            fullWidth
            helperText={errors.customer?.name?.message}
            label={tOrder("checkout.customer.name.label")}
            placeholder={tOrder("checkout.customer.name.placeholder")}
            required
            {...register("customer.name")}
          />
          <Grid container spacing={2} width="100%">
            <Grid size={{ xs: 12, sm: 6 }}>
              <CountrySelect
                error={!!errors.customer?.countryCode}
                helperText={errors.customer?.countryCode?.message}
                label={tOrder("checkout.customer.countryCode.label")}
                mode="country"
                placeholder={tOrder(
                  "checkout.customer.countryCode.placeholder",
                )}
                required
                value={countryCode}
                {...register("customer.countryCode")}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                autoComplete="tel"
                error={!!errors.customer?.telephone}
                fullWidth
                helperText={errors.customer?.telephone?.message}
                label={`${tOrder("checkout.customer.telephone.label")}${isKiosk ? ` ${tCommon("optional")}` : ""}`}
                required={!isKiosk}
                slotProps={{
                  input: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    inputComponent: TextMaskCustom as any,
                    inputProps: { mask, placeholder },
                  },
                }}
                type="tel"
                {...register("customer.telephone")}
              />
            </Grid>
          </Grid>
          <TextField
            error={!!errors.customer?.email}
            fullWidth
            helperText={errors.customer?.email?.message}
            label={`${tOrder("checkout.customer.email.label")} ${tCommon("optional")}`}
            placeholder={tOrder("checkout.customer.email.placeholder")}
            type="email"
            {...register("customer.email")}
          />
          <TextField
            error={!!errors.customer?.remark}
            fullWidth
            helperText={errors.customer?.remark?.message}
            label={`${tOrder("checkout.customer.remark.label")} ${tCommon("optional")}`}
            maxRows={4}
            multiline
            placeholder={tOrder("checkout.customer.remark.placeholder")}
            slotProps={{
              htmlInput: {
                maxLength: 160,
              },
            }}
            {...register("customer.remark")}
          />
          {/* <CouponForm /> */}
          <Divider flexItem />
          <ListRadioGroup
            error={!!errors.invoice?.type}
            helperText={errors.invoice?.type?.message}
            label={tOrder("checkout.invoice.title")}
            onChange={(_, value) =>
              setValue("invoice.type", value as InvoiceType, {
                shouldValidate: isSubmitted,
              })
            }
            options={INVOICE_TYPES.map(({ icon: Icon, type }) => ({
              icon: <Icon fontSize="small" />,
              label: tOrder(`checkout.invoice.${type}`),
              value: type,
            }))}
            value={invoiceType || ""}
          />
          {invoiceType === "personal" && (
            <TextField
              error={!!errors.invoice?.carrierType}
              fullWidth
              helperText={errors.invoice?.carrierType?.message}
              label={tOrder("checkout.invoice.carrierType.label")}
              onChange={(e) =>
                setValue("invoice.carrierType", e.target.value as CarrierType, {
                  shouldValidate: isSubmitted,
                })
              }
              required
              select
              slotProps={{
                inputLabel: { shrink: true },
                select: {
                  displayEmpty: true,
                  renderValue: (selected) =>
                    selected ? (
                      tOrder(`checkout.invoice.${selected as CarrierType}`)
                    ) : (
                      <em>
                        {tOrder("checkout.invoice.carrierType.placeholder")}
                      </em>
                    ),
                },
              }}
              value={carrierType}
            >
              <MenuItem disabled value="">
                <em>{tOrder("checkout.invoice.carrierType.placeholder")}</em>
              </MenuItem>
              {CARRIER_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {tOrder(`checkout.invoice.${type}`)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {invoiceType === "personal" &&
            (carrierType === "mobile" || carrierType === "certificate") && (
              <TextField
                error={!!errors.invoice?.carruerNum}
                fullWidth
                helperText={errors.invoice?.carruerNum?.message}
                label={tOrder("checkout.invoice.carruerNum")}
                required
                slotProps={{
                  input: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    inputComponent: TextMaskCustom as any,
                    inputProps: {
                      mask:
                        carrierType === "mobile"
                          ? "/*******"
                          : "aa00000000000000",
                      placeholder:
                        carrierType === "mobile"
                          ? "/AB12345"
                          : "AB12345678901234",
                      uppercase: true,
                    },
                  },
                }}
                {...register("invoice.carruerNum")}
              />
            )}
          {invoiceType === "company" && (
            <>
              <TextField
                error={!!errors.invoice?.customerIdentifier}
                fullWidth
                helperText={errors.invoice?.customerIdentifier?.message}
                label={tOrder("checkout.invoice.customerIdentifier")}
                required
                slotProps={{
                  input: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    inputComponent: TextMaskCustom as any,
                    inputProps: { mask: "00000000", placeholder: "12345678" },
                  },
                }}
                {...register("invoice.customerIdentifier", {
                  onChange: () =>
                    triggerValidation("invoice.customerIdentifier"),
                })}
              />
              {businessInfo && (
                <>
                  <TextField
                    error={!!errors.invoice?.customerName}
                    fullWidth
                    helperText={errors.invoice?.customerName?.message}
                    label={tOrder("checkout.invoice.customerName")}
                    required
                    slotProps={{
                      input: { readOnly: true },
                      inputLabel: { shrink: true },
                    }}
                    {...register("invoice.customerName")}
                  />
                  <TextField
                    error={!!errors.invoice?.customerAddr}
                    fullWidth
                    helperText={errors.invoice?.customerAddr?.message}
                    label={tOrder("checkout.invoice.customerAddr")}
                    required
                    slotProps={{
                      input: { readOnly: true },
                      inputLabel: { shrink: true },
                    }}
                    {...register("invoice.customerAddr")}
                  />
                </>
              )}
            </>
          )}
          {invoiceType === "donate" && (
            <DonateCodeSelect
              error={!!errors.invoice?.donateCode}
              helperText={errors.invoice?.donateCode?.message}
              label={tOrder("checkout.invoice.donateCode.label")}
              placeholder={tOrder("checkout.invoice.donateCode.placeholder")}
              required
              value={donateCode}
              {...register("invoice.donateCode")}
            />
          )}
          <Divider flexItem />
          <ListRadioGroup
            error={!!errors.payment}
            helperText={errors.payment?.message}
            label={tOrder("checkout.paymentMethod")}
            onChange={(_, value) =>
              setValue("payment", value as PaymentMethod, {
                shouldValidate: isSubmitted,
              })
            }
            options={paymentOptions.map(
              ({ disabled, disabledReason, icon, id, label }) => ({
                disabled,
                disabledReason,
                icon,
                label,
                value: id,
              }),
            )}
            value={payment || ""}
          />
        </StyledCardContent>
      </Card>
      <Stack direction="row" justifyContent="space-between">
        <Button
          disabled={isMutatingEcpay || isMutatingOrder}
          onClick={() => router.push(pathname.replace("/checkout", "/cart"))}
          startIcon={<ShoppingCart />}
          variant="outlined"
        >
          {tOrder("checkout.back")}
        </Button>
        <Button
          disabled={isCartEmpty || hasInvalidItems}
          endIcon={<TaskAlt />}
          loading={isMutatingEcpay || isMutatingOrder}
          loadingPosition="end"
          type="submit"
          variant="contained"
        >
          {tOrder("checkout.placeOrder")}
        </Button>
      </Stack>
    </FormBox>
  );
};

export default OrderModeOrganizationSlugCheckout;
