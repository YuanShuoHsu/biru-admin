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
import ListRadioGroup from "@/components/ListRadioGroup";

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
  Autocomplete,
  Button,
  Card,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import type { CreateEcpayDto } from "@/types/ecpay/createEcpayDto";
import type { PaymentMethod } from "@/types/payment";

import { fetcher, sendRequest } from "@/utils/fetcher";
import { getChoiceNames, getItemName } from "@/utils/menus";

import FormBox from "@/components/FormBox";
import { StyledCardContent } from "@/components/FormCard";

const INVOICE_TYPES: { icon: React.ElementType; type: InvoiceType }[] = [
  { icon: Person, type: "personal" },
  { icon: Business, type: "company" },
  { icon: VolunteerActivism, type: "donate" },
];

const CARRIER_TYPES: CarrierType[] = ["individual", "mobile", "certificate"];

type LoveCodeOption = { label: string; loveCode: string; short?: string };

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
    setValue,
  } = useForm<CustomerPaymentFormValues>({
    defaultValues: {
      carrierType: "individual",
      email: "",
      invoiceInfo: {
        address: "",
        carruerNum: "",
        customerIdentifier: "",
        customerName: "",
        loveCode: "",
      },
      invoiceType: "personal",
      name: "",
      notes: "",
      payment: null,
      phone: "",
    },
    resolver: zodResolver(customerPaymentFormSchema),
  });

  const [carrierType, invoiceType, loveCode, payment] = useWatch({
    control,
    name: ["carrierType", "invoiceType", "invoiceInfo.loveCode", "payment"],
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

  const { data: loveCodes = [] } = useSWR<LoveCodeOption[]>(
    invoiceType === "donate" ? "/api/love-codes" : null,
    fetcher,
  );

  const { isMutating, trigger } = useSWRMutation(
    "/api/ecpay",
    sendRequest<{ message: string }, CreateEcpayDto>(),
  );

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

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
        CustomerEmail: values.email,
        CustomerName: values.name,
        CustomerPhone: values.phone,
        DelayDay: "0",
        Donation: "0",
        InvType: "07",
        TaxType: "1",
      };
      switch (values.invoiceType) {
        case "personal":
          if (values.carrierType === "mobile") {
            return {
              ...common,
              CarruerNum: values.invoiceInfo.carruerNum,
              CarruerType: "3",
              Print: "0",
            };
          }
          if (values.carrierType === "certificate") {
            return {
              ...common,
              CarruerNum: values.invoiceInfo.carruerNum,
              CarruerType: "2",
              Print: "0",
            };
          }
          return { ...common, CarruerType: "", Donation: "0", Print: "0" };
        case "company":
          return {
            ...common,
            CarruerType: "",
            CustomerAddr: values.invoiceInfo.address,
            CustomerIdentifier: values.invoiceInfo.customerIdentifier,
            CustomerName: values.invoiceInfo.customerName,
            Print: "1",
          };
        case "donate":
          return {
            ...common,
            CarruerType: "",
            Donation: "1",
            LoveCode: values.invoiceInfo.loveCode,
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
        Remark: values.notes || undefined,
      },
      invoice: buildInvoice(),
    };

    const { message: data } = await trigger(dto);

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
            error={!!errors.name}
            fullWidth
            helperText={errors.name?.message}
            label={tOrder("checkout.name")}
            required
            {...register("name")}
          />
          <TextField
            error={!!errors.phone}
            fullWidth
            helperText={errors.phone?.message}
            label={tOrder("checkout.phone")}
            required={isPickup}
            type="tel"
            {...register("phone")}
          />
          <TextField
            error={!!errors.email}
            fullWidth
            helperText={errors.email?.message}
            label={tOrder("checkout.email")}
            required={
              invoiceType === "personal" && carrierType === "individual"
            }
            type="email"
            {...register("email")}
          />
          <TextField
            error={!!errors.notes}
            fullWidth
            helperText={errors.notes?.message}
            label={tOrder("checkout.notes")}
            maxRows={4}
            multiline
            slotProps={{
              htmlInput: {
                maxLength: 160,
              },
            }}
            {...register("notes")}
          />
          {/* <CouponForm /> */}
          <Divider flexItem />
          <ListRadioGroup
            label={tOrder("checkout.invoice.title")}
            onChange={(_, value) =>
              setValue("invoiceType", value as InvoiceType, {
                shouldValidate: isSubmitted,
              })
            }
            options={INVOICE_TYPES.map(({ icon, type }) => ({
              icon,
              label: tOrder(`checkout.invoice.${type}`),
              value: type,
            }))}
            value={invoiceType}
          />
          {invoiceType === "personal" && (
            <TextField
              error={!!errors.carrierType}
              fullWidth
              helperText={errors.carrierType?.message}
              label={tOrder("checkout.invoice.carrierType.label")}
              onChange={(e) =>
                setValue("carrierType", e.target.value as CarrierType, {
                  shouldValidate: isSubmitted,
                })
              }
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
                error={!!errors.invoiceInfo?.carruerNum}
                fullWidth
                helperText={errors.invoiceInfo?.carruerNum?.message}
                label={tOrder("checkout.invoice.carruerNum")}
                placeholder={
                  carrierType === "mobile" ? "/AB12345" : "AB12345678901234"
                }
                required
                slotProps={{ inputLabel: { shrink: true } }}
                {...register("invoiceInfo.carruerNum")}
              />
            )}
          {invoiceType === "company" && (
            <>
              <TextField
                error={!!errors.invoiceInfo?.customerIdentifier}
                fullWidth
                helperText={errors.invoiceInfo?.customerIdentifier?.message}
                label={tOrder("checkout.invoice.customerIdentifier")}
                required
                {...register("invoiceInfo.customerIdentifier")}
              />
              <TextField
                error={!!errors.invoiceInfo?.customerName}
                fullWidth
                helperText={errors.invoiceInfo?.customerName?.message}
                label={tOrder("checkout.invoice.customerName")}
                required
                {...register("invoiceInfo.customerName")}
              />
              <TextField
                error={!!errors.invoiceInfo?.address}
                fullWidth
                helperText={errors.invoiceInfo?.address?.message}
                label={tOrder("checkout.invoice.customerAddr")}
                required
                {...register("invoiceInfo.address")}
              />
            </>
          )}
          {invoiceType === "donate" && (
            <Autocomplete
              filterOptions={(options, { inputValue }) =>
                options.filter(
                  ({ label, loveCode: code, short }) =>
                    label.includes(inputValue) ||
                    (short && short.includes(inputValue)) ||
                    code.startsWith(inputValue),
                )
              }
              freeSolo
              fullWidth
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.loveCode
              }
              inputValue={loveCode}
              onInputChange={(_, value) =>
                setValue("invoiceInfo.loveCode", value, {
                  shouldValidate: isSubmitted,
                })
              }
              options={loveCodes}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={!!errors.invoiceInfo?.loveCode}
                  helperText={
                    errors.invoiceInfo?.loveCode?.message ||
                    tOrder("checkout.invoice.donateFormat")
                  }
                  label={tOrder("checkout.invoice.loveCode")}
                  required
                />
              )}
              renderOption={({ key, ...props }, option) => (
                <li key={key} {...props}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ width: "100%" }}
                  >
                    <Typography>{option.short || option.label}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {option.loveCode}
                    </Typography>
                  </Stack>
                </li>
              )}
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
