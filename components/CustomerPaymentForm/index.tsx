"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWRMutation from "swr/mutation";

import InvoiceForm, {
  isInvoiceValid,
  type InvoiceInfo,
  type InvoiceType,
} from "./InvoiceForm";
import VerticalSpacingToggleButton from "./VerticalSpacingToggleButton";

import { localeConfigs } from "@/constants/locale";
import { ORDER_MODE } from "@/constants/orderMode";

import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Button,
  Divider,
  Paper,
  type PaperProps,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useCartStore } from "@/providers/cart-store-provider";
import { useMenuStore } from "@/providers/menu-store-provider";

import useCartTotals from "@/hooks/useCartTotals";

import type { CreateEcpayDto } from "@/types/ecpay/createEcpayDto";
import type { PaymentMethod } from "@/types/payment";
import type { RouteParams } from "@/types/routeParams";

import { getChoiceNames, getItemName } from "@/utils/menus";

const sendRequest = async (url: string, { arg }: { arg: CreateEcpayDto }) =>
  fetch(url, {
    method: "POST",
    body: JSON.stringify(arg),
  }).then((res) => res.json());

const StyledPaper = styled((props: PaperProps) => <Paper {...props} />)(
  ({ theme }) => ({
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
  }),
);

const CustomerPaymentForm = () => {
  const { mode } = useParams<Partial<RouteParams>>();
  const isPickup = mode === ORDER_MODE.Pickup;

  const [customerInfo, setCustomerInfo] = useState({
    email: "",
    name: "",
    notes: "",
    phone: "",
  });

  const [payment, setPayment] = useState<PaymentMethod | null>(null);

  const [invoiceType, setInvoiceType] = useState<InvoiceType>("individual");
  const [invoiceInfo, setInvoiceInfo] = useState<InvoiceInfo>({
    carruerNum: "",
    customerIdentifier: "",
    customerName: "",
    loveCode: "",
  });

  const { isCartEmpty, cartItemsList } = useCartStore((state) => state);
  const { menu } = useMenuStore((state) => state);
  const { cartTotalAmount } = useCartTotals();

  const locale = useLocale();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";
  const completePath = `${pathname.replace("/checkout", "/complete")}${query}`;
  // const isDineIn = mode === ORDER_MODE.DineIn;

  const router = useRouter();

  const { isMutating, trigger } = useSWRMutation("/api/ecpay", sendRequest);

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo({ ...customerInfo, [name]: value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (payment === "Cash") {
      router.replace(completePath);
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_NEXT_URL;
    const completeUrl = `${baseUrl}/${locale}${completePath}`;

    const buildInvoice = (): CreateEcpayDto["invoice"] => {
      const common = {
        CustomerEmail: customerInfo.email,
        CustomerName: customerInfo.name,
        CustomerPhone: customerInfo.phone,
        DelayDay: "0",
        Donation: "0",
        InvType: "07",
        TaxType: "1",
      };
      switch (invoiceType) {
        case "individual":
          return { ...common, CarruerType: "", Donation: "0", Print: "0" };
        case "mobile":
          return {
            ...common,
            CarruerNum: invoiceInfo.carruerNum,
            CarruerType: "3",
            Print: "0",
          };
        case "certificate":
          return {
            ...common,
            CarruerNum: invoiceInfo.carruerNum,
            CarruerType: "2",
            Print: "0",
          };
        case "company":
          return {
            ...common,
            CarruerType: "",
            CustomerIdentifier: invoiceInfo.customerIdentifier,
            CustomerName: invoiceInfo.customerName,
            Print: "1",
          };
        case "donate":
          return {
            ...common,
            CarruerType: "",
            Donation: "1",
            LoveCode: invoiceInfo.loveCode,
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
        ChoosePayment: payment as CreateEcpayDto["base"]["ChoosePayment"],
        ClientBackURL: completeUrl,
        OrderResultURL: completeUrl,
        NeedExtraPaidInfo: "Y" as const,
        Language: localeConfigs[locale].ecpayLanguage,
      },
      invoice: buildInvoice(),
    };

    const { data } = await trigger(dto);

    const parser = new DOMParser();
    const doc = parser.parseFromString(data, "text/html");
    const form = doc.getElementById("ecpayForm");

    if (form instanceof HTMLFormElement) {
      document.body.appendChild(form);
      form.submit();
    }
  };

  return (
    <StyledPaper component="form" onSubmit={handleSubmit}>
      <Typography color="text.secondary" variant="subtitle2">
        {tOrder("checkout.title")}
      </Typography>
      <TextField
        fullWidth
        label={tOrder("checkout.name")}
        name="name"
        onChange={handleInfoChange}
        required
        value={customerInfo.name}
      />
      <TextField
        fullWidth
        label={tOrder("checkout.phone")}
        name="phone"
        onChange={handleInfoChange}
        required={isPickup}
        type="tel"
        value={customerInfo.phone}
      />
      <TextField
        fullWidth
        label={tOrder("checkout.email")}
        name="email"
        onChange={handleInfoChange}
        type="email"
        value={customerInfo.email}
      />
      <TextField
        fullWidth
        label={tOrder("checkout.notes")}
        maxRows={4}
        multiline
        name="notes"
        onChange={handleInfoChange}
        slotProps={{
          htmlInput: {
            maxLength: 50,
          },
        }}
        value={customerInfo.notes}
      />
      {/* <CouponForm /> */}
      <Divider />
      <Typography color="text.secondary" variant="subtitle2">
        {tOrder("checkout.paymentMethod")}
      </Typography>
      <VerticalSpacingToggleButton payment={payment} setPayment={setPayment} />
      <Divider />
      <Typography color="text.secondary" variant="subtitle2">
        {tOrder("checkout.invoice.title")}
      </Typography>
      <InvoiceForm
        invoiceInfo={invoiceInfo}
        invoiceType={invoiceType}
        setInvoiceInfo={setInvoiceInfo}
        setInvoiceType={setInvoiceType}
      />
      <Button
        disabled={
          isCartEmpty || !payment || !isInvoiceValid(invoiceType, invoiceInfo)
        }
        fullWidth
        loading={isMutating}
        loadingPosition="end"
        size="large"
        type="submit"
        variant="contained"
      >
        {tOrder("checkout.placeOrder")}
      </Button>
    </StyledPaper>
  );
};

export default CustomerPaymentForm;
