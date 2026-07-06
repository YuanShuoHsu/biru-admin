// vibe coding

"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { Divider, Stack, Typography } from "@mui/material";

import type { OrderItemResponse, OrderResponse } from "@/types/orders";

import { getOrderTotalAmount } from "@/utils/orders";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    gap={2}
  >
    <Typography color="text.secondary" variant="body2">
      {label}
    </Typography>
    <Typography sx={{ wordBreak: "break-all" }} variant="body2">
      {value}
    </Typography>
  </Stack>
);

interface OrderDetailDialogProps {
  order: OrderResponse;
}

const OrderDetailDialog = ({ order }: OrderDetailDialogProps) => {
  const format = useFormatter();

  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const currency = order.items[0]?.priceCurrency || "";
  const totalAmount = getOrderTotalAmount(order);

  const getOrderItemName = ({
    addOns,
    menuItemName,
    modifiers,
  }: OrderItemResponse) => {
    const choiceNames = [
      ...(modifiers || []).map(({ modifierName }) => modifierName),
      ...(addOns || []).flatMap(
        ({ menuItemName: addOnName, modifiers: addOnModifiers }) => [
          addOnName,
          ...addOnModifiers.map(({ modifierName }) => modifierName),
        ],
      ),
    ].join(tCommon("delimiter"));

    return choiceNames
      ? `${menuItemName}${tCommon("parenthesisOpen")}${choiceNames}${tCommon("parenthesisClose")}`
      : menuItemName;
  };

  return (
    <Stack gap={2}>
      <Stack gap={1}>
        <Typography
          color="text.secondary"
          fontWeight="bold"
          variant="subtitle2"
        >
          {tOrders("detail.customer.title")}
        </Typography>
        <InfoRow
          label={tOrders("detail.customer.name")}
          value={order.customer.name}
        />
        {order.customer.telephone && (
          <InfoRow
            label={tOrders("detail.customer.telephone")}
            value={order.customer.telephone}
          />
        )}
        {order.customer.email && (
          <InfoRow
            label={tOrders("detail.customer.email")}
            value={order.customer.email}
          />
        )}
        {order.customer.remark && (
          <InfoRow
            label={tOrders("detail.customer.remark")}
            value={order.customer.remark}
          />
        )}
      </Stack>
      <Divider />
      <Stack gap={1}>
        <Typography
          color="text.secondary"
          fontWeight="bold"
          variant="subtitle2"
        >
          {tOrders("detail.transaction.title")}
        </Typography>
        <InfoRow label={tOrders("orderNumber")} value={order.orderNumber} />
        {order.confirmationNumber && (
          <InfoRow
            label={tOrders("confirmationNumber")}
            value={order.confirmationNumber}
          />
        )}
        <InfoRow
          label={tOrders("mode")}
          value={tOrder(`mode.${order.mode}.label`)}
        />
        <InfoRow
          label={tOrders("paymentMethod")}
          value={tOrder(`checkout.payment.${order.paymentMethod}`)}
        />
        <InfoRow
          label={tOrders("orderStatus")}
          value={tOrders(`status.${order.orderStatus}`)}
        />
        {order.paymentDate && (
          <InfoRow
            label={tOrders("paymentDate")}
            value={format.dateTime(new Date(order.paymentDate), "short")}
          />
        )}
        <InfoRow
          label={tOrders("createdAt")}
          value={format.dateTime(new Date(order.createdAt), "short")}
        />
      </Stack>
      <Divider />
      <Stack gap={1}>
        <Typography
          color="text.secondary"
          fontWeight="bold"
          variant="subtitle2"
        >
          {tOrders("detail.items.title")}
        </Typography>
        {order.items.map((item) => (
          <Stack
            direction="row"
            gap={1}
            justifyContent="space-between"
            key={item.id}
          >
            <Typography variant="body2">
              {getOrderItemName(item)} {tCommon("multiply")}{" "}
              {item.orderQuantity}
            </Typography>
            <Typography flexShrink={0} variant="body2">
              {item.priceCurrency}{" "}
              {(Number(item.unitPrice) * item.orderQuantity).toLocaleString(
                locale,
              )}
            </Typography>
          </Stack>
        ))}
        <Divider />
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Typography fontWeight="bold" variant="subtitle1">
            {tOrders("detail.total")}
          </Typography>
          <Typography color="primary" fontWeight="bold" variant="h6">
            {currency} {totalAmount.toLocaleString(locale)}
          </Typography>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default OrderDetailDialog;
