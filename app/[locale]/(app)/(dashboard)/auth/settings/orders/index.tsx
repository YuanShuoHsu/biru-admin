"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import useSWR from "swr";

import { getOrdersKey, PAGE_SIZE } from "./constants";

import CustomizedAccordions from "@/components/CustomizedAccordions";
import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  Chip,
  type ChipProps,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useAuthStore } from "@/providers/auth-store-provider";

import type { UserOrderListResponse, UserOrderResponse } from "@/types/orders";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledPagination = styled(Pagination)({
  alignSelf: "center",
});

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

interface OrdersProps {
  orders: UserOrderListResponse | null;
  page: number;
}

const Orders = ({ orders: initialOrders, page: initialPage }: OrdersProps) => {
  const [expanded, setExpanded] = useState<string | false>(false);
  const [page, setPage] = useState(initialPage);

  const { session } = useAuthStore((state) => state);

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const { data } = useSWR<UserOrderListResponse | null>(
    session ? getOrdersKey(page) : null,
    {
      fallbackData: initialOrders,
    },
  );
  const orders = data?.data || [];
  const pageCount = Math.ceil((data?.total || 0) / PAGE_SIZE);

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, newExpanded: boolean) =>
      setExpanded(newExpanded ? panel : false);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value);

    router.replace(`${pathname}?page=${value}`);
  };

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
        {orders.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("settings.orders.empty")}
          </Typography>
        )}
        {orders.map((order) => {
          const currency = order.items[0]?.priceCurrency || "";
          const isExpanded = expanded === order.id;
          const totalAmount = order.items.reduce(
            (sum, { orderQuantity, unitPrice }) =>
              sum + Number(unitPrice) * orderQuantity,
            0,
          );

          return (
            <CustomizedAccordions
              expanded={isExpanded}
              key={order.id}
              onChange={handleChange(order.id)}
              summary={
                <Stack flex={1} gap={0.5}>
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
                      label={tAuth(
                        `settings.orders.status.${order.orderStatus}`,
                      )}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  <Stack
                    alignItems="center"
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography color="text.secondary" variant="caption">
                      {dayjs(order.createdAt)
                        .tz("Asia/Taipei")
                        .format("YYYY/MM/DD HH:mm:ss")}
                    </Typography>
                    <Typography
                      color="primary"
                      fontWeight="bold"
                      variant="subtitle2"
                    >
                      {tOrder("complete.summary.total")} {currency}{" "}
                      {totalAmount.toLocaleString(locale)}
                    </Typography>
                  </Stack>
                </Stack>
              }
            >
              <Stack gap={1} padding={2}>
                <Typography color="text.secondary" variant="caption">
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
                      {(
                        Number(item.unitPrice) * item.orderQuantity
                      ).toLocaleString(locale)}
                    </Typography>
                  </Stack>
                ))}
                <Typography color="text.secondary" variant="body2">
                  {tOrder(`checkout.payment.${order.paymentMethod}`)}
                </Typography>
              </Stack>
            </CustomizedAccordions>
          );
        })}
        {pageCount > 0 && (
          <StyledPagination
            count={pageCount}
            onChange={handlePageChange}
            page={page}
          />
        )}
      </StyledCardContent>
    </FormCard>
  );
};

export default Orders;
