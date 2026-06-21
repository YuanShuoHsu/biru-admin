"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import {
  type CarrierType,
  type CustomerPaymentFormValues,
  type InvoiceType,
  useCustomerPaymentFormSchema,
} from "./definitions";

import CustomizedAccordions from "@/components/CustomizedAccordions";
import DonateCodeSelect from "@/components/DonateCodeSelect";
import FormBox from "@/components/FormBox";
import { StyledCardContent } from "@/components/FormCard";
import ListRadioGroup from "@/components/ListRadioGroup";
import TextMaskCustom from "@/components/TextMaskCustom";

import { localeConfigs } from "@/constants/locale";
import { ORDER_MODE } from "@/constants/orderMode";

import { zodResolver } from "@hookform/resolvers/zod";

import useCartTotals from "@/hooks/useCartTotals";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  Business,
  CreditCard,
  MarkChatRead,
  Payments,
  Person,
  QrCodeScanner,
  ShoppingCart,
  TaskAlt,
  VolunteerActivism,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Checkbox,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import type { CreateEcpayDto } from "@/types/ecpay/createEcpayDto";
import type { PaymentMethod } from "@/types/payment";

import { sendRequest } from "@/utils/fetcher";
import { getChoiceNames, getItemName } from "@/utils/menus";

const INVOICE_TYPES: { icon: React.ElementType; type: InvoiceType }[] = [
  { icon: Person, type: "personal" },
  { icon: Business, type: "company" },
  { icon: VolunteerActivism, type: "donate" },
];

const CARRIER_TYPES: CarrierType[] = ["individual", "mobile", "certificate"];

const OrderModeOrganizationSlugCheckout = () => {
  const { isCartEmpty, cartItemsList } = useCartStore((state) => state);
  const { menu } = useMenuStore((state) => state);

  const { cartTotalAmount } = useCartTotals();

  const customerPaymentFormSchema = useCustomerPaymentFormSchema();

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
        email: "",
        name: "",
        notes: "",
        phone: "",
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
    carrierType,
    emailSameAsCustomer,
    customerIdentifier,
    donateCode,
    invoiceType,
    payment,
  ] = useWatch({
    control,
    name: [
      "invoice.carrierType",
      "invoice.emailSameAsCustomer",
      "invoice.customerIdentifier",
      "invoice.donateCode",
      "invoice.type",
      "payment",
    ],
  });

  const locale = useLocale();

  const { mode } = useParams();
  const isPickup = mode === ORDER_MODE.Pickup;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  const completePath = `${pathname.replace("/checkout", "/complete")}${query}`;
  // const isDineIn = mode === ORDER_MODE.DineIn;

  const router = useRouter();

  const { isMutating, trigger: triggerEcpay } = useSWRMutation(
    "/api/ecpay",
    sendRequest<{ message: string }, CreateEcpayDto>(),
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
    ...(mode === ORDER_MODE.DineIn
      ? [{ icon: Payments, id: "Cash", label: tOrder("checkout.payment.Cash") }]
      : []),
    {
      icon: CreditCard,
      id: "Credit",
      label: tOrder("checkout.payment.Credit"),
    },
    { icon: QrCodeScanner, id: "TWQR", label: tOrder("checkout.payment.TWQR") },
    {
      icon: MarkChatRead,
      id: "WeiXin",
      label: tOrder("checkout.payment.WeiXin"),
    },
  ];

  const onSubmit = handleSubmit(async (values) => {
    if (values.payment === "Cash") {
      router.replace(completePath);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL;
    const completeUrl = `${baseUrl}/${locale}${completePath}`;

    const buildInvoice = (): CreateEcpayDto["invoice"] => {
      const common = {
        CustomerEmail: values.invoice.emailSameAsCustomer
          ? values.customer.email
          : values.invoice.email,
        CustomerName: values.customer.name,
        CustomerPhone: values.customer.phone,
        DelayDay: "0",
        Donation: "0",
        InvType: "07",
        TaxType: "1",
      };
      switch (values.invoice.type) {
        case "personal":
          if (values.invoice.carrierType === "mobile") {
            return {
              ...common,
              CarruerNum: values.invoice.carruerNum,
              CarruerType: "3",
              Print: "0",
            };
          }
          if (values.invoice.carrierType === "certificate") {
            return {
              ...common,
              CarruerNum: values.invoice.carruerNum,
              CarruerType: "2",
              Print: "0",
            };
          }
          return { ...common, CarruerType: "", Donation: "0", Print: "0" };
        case "company":
          return {
            ...common,
            CarruerType: "",
            CustomerAddr: values.invoice.customerAddr,
            CustomerIdentifier: values.invoice.customerIdentifier,
            CustomerName: values.invoice.customerName,
            Print: "1",
          };
        case "donate":
          return {
            ...common,
            CarruerType: "",
            Donation: "1",
            LoveCode: values.invoice.donateCode,
            Print: "0",
          };
      }
    };

    const dto = {
      base: {
        TotalAmount: cartTotalAmount,
        TradeDesc: tOrder("checkout.tradeDesc"),
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
        ChoosePayment:
          values.payment as CreateEcpayDto["base"]["ChoosePayment"],
        ClientBackURL: completeUrl,
        OrderResultURL: completeUrl,
        Language: localeConfigs[locale].ecpayLanguage,
        NeedExtraPaidInfo: "Y" as const,
        Remark: values.customer.notes || undefined,
      },
      invoice: buildInvoice(),
    };

    const { message: data } = await triggerEcpay(dto);

    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");
    const form = doc.getElementById("ecpayForm");

    if (form instanceof HTMLFormElement) {
      document.body.appendChild(form);
      form.submit();
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
          <TextField
            error={!!errors.customer?.phone}
            fullWidth
            helperText={errors.customer?.phone?.message}
            label={`${tOrder("checkout.customer.phone.label")}${!isPickup ? ` ${tCommon("optional")}` : ""}`}
            placeholder={tOrder("checkout.customer.phone.placeholder")}
            required={isPickup}
            type="tel"
            {...register("customer.phone")}
          />
          <TextField
            error={!!errors.customer?.email}
            fullWidth
            helperText={errors.customer?.email?.message}
            label={`${tOrder("checkout.customer.email.label")}${!(invoiceType === "personal" && carrierType === "individual" && emailSameAsCustomer) ? ` ${tCommon("optional")}` : ""}`}
            placeholder={tOrder("checkout.customer.email.placeholder")}
            required={
              invoiceType === "personal" &&
              carrierType === "individual" &&
              emailSameAsCustomer
            }
            type="email"
            {...register("customer.email")}
          />
          <TextField
            error={!!errors.customer?.notes}
            fullWidth
            helperText={errors.customer?.notes?.message}
            label={`${tOrder("checkout.customer.notes.label")} ${tCommon("optional")}`}
            maxRows={4}
            multiline
            placeholder={tOrder("checkout.customer.notes.placeholder")}
            slotProps={{
              htmlInput: {
                maxLength: 160,
              },
            }}
            {...register("customer.notes")}
          />
          {/* <CouponForm /> */}
          <Divider flexItem />
          <ListRadioGroup
            label={tOrder("checkout.invoice.title")}
            onChange={(_, value) =>
              setValue("invoice.type", value as InvoiceType, {
                shouldValidate: isSubmitted,
              })
            }
            options={INVOICE_TYPES.map(({ icon, type }) => ({
              icon,
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
          {invoiceType === "personal" && carrierType === "individual" && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={emailSameAsCustomer}
                    size="small"
                    {...register("invoice.emailSameAsCustomer")}
                  />
                }
                label={tOrder("checkout.invoice.invoiceEmail.sameAsCustomer")}
                slotProps={{ typography: { variant: "body2" } }}
              />
              {!emailSameAsCustomer && (
                <TextField
                  error={!!errors.invoice?.email}
                  fullWidth
                  helperText={errors.invoice?.email?.message}
                  label={tOrder("checkout.invoice.invoiceEmail.label")}
                  placeholder={tOrder(
                    "checkout.invoice.invoiceEmail.placeholder",
                  )}
                  required
                  type="email"
                  {...register("invoice.email")}
                />
              )}
            </>
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
                          ? "/AAAAAAA"
                          : "aa00000000000000",
                      placeholder:
                        carrierType === "mobile"
                          ? "/AB12345"
                          : "AB12345678901234",
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
            options={paymentOptions.map(({ icon, id, label }) => ({
              icon,
              label,
              value: id,
            }))}
            value={payment || ""}
          />
        </StyledCardContent>
      </Card>
      <Stack direction="row" justifyContent="space-between">
        <Button
          disabled={isMutating}
          onClick={() => router.push(pathname.replace("/checkout", "/cart"))}
          startIcon={<ShoppingCart />}
          variant="outlined"
        >
          {tOrder("checkout.back")}
        </Button>
        <Button
          disabled={isCartEmpty}
          endIcon={<TaskAlt />}
          loading={isMutating}
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
