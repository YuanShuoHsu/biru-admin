"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";

import { STATUS_COLORS } from "@/constants/orders";

import { useOrderItemName } from "@/hooks/useOrderItemName";

import { Chip, Divider, Stack, Typography } from "@mui/material";

import type { OrderResponse } from "@/types/orders";

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
    {typeof value === "string" ? (
      <Typography sx={{ wordBreak: "break-all" }} variant="body2">
        {value}
      </Typography>
    ) : (
      value
    )}
  </Stack>
);

interface OrderDetailDialogProps {
  order: OrderResponse;
}

const OrderDetailDialog = ({ order }: OrderDetailDialogProps) => {
  const format = useFormatter();

  const locale = useLocale();

  const getOrderItemName = useOrderItemName();

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const currency = order.items[0]?.priceCurrency || "";
  const discount = Number(order.discount || 0);
  const totalAmount = getOrderTotalAmount(order);

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
          value={
            <Chip
              color={STATUS_COLORS[order.orderStatus]}
              label={tOrders(`status.${order.orderStatus}`)}
              size="small"
              variant="outlined"
            />
          }
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
        {discount > 0 && (
          <Stack direction="row" gap={1} justifyContent="space-between">
            <Typography variant="body2">
              {tOrders("detail.discount")}
              {order.discountCode
                ? `${tCommon("parenthesisOpen")}${order.discountCode}${tCommon("parenthesisClose")}`
                : ""}
            </Typography>
            <Typography color="primary" flexShrink={0} variant="body2">
              -{currency} {discount.toLocaleString(locale)}
            </Typography>
          </Stack>
        )}
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
