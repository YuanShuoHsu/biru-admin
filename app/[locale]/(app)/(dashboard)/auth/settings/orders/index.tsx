"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import useSWR from "swr";

import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import {
  Chip,
  type ChipProps,
  Divider,
  Pagination,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { UserOrderListResponse, UserOrderResponse } from "@/types/orders";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const PAGE_SIZE = 10;

const STATUS_CHIP_COLORS: Record<
  UserOrderResponse["orderStatus"],
  ChipProps["color"]
> = {
  OrderCancelled: "default",
  OrderDelivered: "success",
  OrderPaymentDue: "warning",
  OrderPickupAvailable: "info",
  OrderProblem: "error",
  OrderProcessing: "info",
};

const Orders = () => {
  const [page, setPage] = useState(1);

  const { session } = useAuthStore((state) => state);

  const locale = useLocale();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const { data, isLoading } = useSWR<UserOrderListResponse>(
    session
      ? `/api/users/me/orders?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`
      : null,
  );
  const orders = data?.data || [];
  const pageCount = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) =>
    setPage(value);

  const getOrderItemName = ({
    addOns,
    menuItemName,
    modifiers,
  }: UserOrderResponse["items"][number]) => {
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
    <FormCard>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("settings.orders.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        {isLoading && (
          <Stack gap={2}>
            <Skeleton height={96} variant="rounded" />
            <Skeleton height={96} variant="rounded" />
          </Stack>
        )}
        {!isLoading && orders.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("settings.orders.empty")}
          </Typography>
        )}
        {orders.map((order, index) => {
          const currency = order.items[0]?.priceCurrency || "";
          const totalAmount = order.items.reduce(
            (sum, { orderQuantity, unitPrice }) =>
              sum + Number(unitPrice) * orderQuantity,
            0,
          );

          return (
            <Stack gap={1} key={order.id}>
              {index > 0 && <Divider />}
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
              >
                <Typography fontWeight="bold" variant="subtitle2">
                  {order.seller.name}
                </Typography>
                <Chip
                  color={STATUS_CHIP_COLORS[order.orderStatus]}
                  label={tAuth(`settings.orders.status.${order.orderStatus}`)}
                  size="small"
                  variant="outlined"
                />
              </Stack>
              <Typography color="text.secondary" variant="caption">
                {dayjs(order.createdAt)
                  .tz("Asia/Taipei")
                  .format("YYYY/MM/DD HH:mm:ss")}
                {tCommon("delimiter")}
                {tOrder("complete.transaction.orderNo")}{" "}
                {order.confirmationNumber || order.orderNumber}
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
                    {currency}{" "}
                    {(Number(item.unitPrice) * item.orderQuantity).toLocaleString(
                      locale,
                    )}
                  </Typography>
                </Stack>
              ))}
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="space-between"
              >
                <Typography color="text.secondary" variant="body2">
                  {tOrder(`checkout.payment.${order.paymentMethod}`)}
                </Typography>
                <Typography color="primary" fontWeight="bold" variant="subtitle1">
                  {tOrder("complete.summary.total")} {currency}{" "}
                  {totalAmount.toLocaleString(locale)}
                </Typography>
              </Stack>
            </Stack>
          );
        })}
        {pageCount > 1 && (
          <Pagination
            count={pageCount}
            onChange={handlePageChange}
            page={page}
            sx={{ alignSelf: "center" }}
          />
        )}
      </StyledCardContent>
    </FormCard>
  );
};

export default Orders;
