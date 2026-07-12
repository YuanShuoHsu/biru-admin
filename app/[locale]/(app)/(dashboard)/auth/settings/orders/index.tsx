"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { PAGE_SIZE_OPTIONS } from "./constants";

import CustomizedAccordions from "@/components/CustomizedAccordions";
import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import PaginationActions, {
  StyledTablePagination,
} from "@/components/PaginationActions";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Chip, type ChipProps, Stack, Typography } from "@mui/material";

import type { UserOrderListResponse, UserOrderResponse } from "@/types/orders";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

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
  pageSize: number;
}

const Orders = ({ orders: data, page, pageSize }: OrdersProps) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const orders = data?.data || [];
  const rowsPerPageOptions = [
    ...new Set([...PAGE_SIZE_OPTIONS, pageSize]),
  ].sort((a, b) => a - b);
  const total = data?.total || 0;

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, newExpanded: boolean) =>
      setExpanded(newExpanded ? panel : false);

  const handlePageChange = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) =>
    router.replace(
      `${pathname}?${new URLSearchParams({
        page: String(newPage + 1),
        pageSize: String(pageSize),
      })}`,
    );

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) =>
    router.replace(
      `${pathname}?${new URLSearchParams({
        page: "1",
        pageSize: event.target.value,
      })}`,
    );

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
          const discount = Number(order.discount || 0);
          const isExpanded = expanded === order.id;
          const totalAmount =
            order.items.reduce(
              (sum, { orderQuantity, unitPrice }) =>
                sum + Number(unitPrice) * orderQuantity,
              0,
            ) - discount;

          return (
            <CustomizedAccordions
              expanded={isExpanded}
              key={order.id}
              onChange={handleChange(order.id)}
              summary={
                <Stack flex={1} gap={1}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
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
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
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
              <Stack padding={2} gap={1}>
                <Typography color="text.secondary" variant="caption">
                  {tOrder("complete.transaction.orderNo")}{" "}
                  {order.confirmationNumber || order.orderNumber}
                </Typography>
                {order.items.map((item) => (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    gap={1}
                    key={item.id}
                  >
                    <Typography variant="body2">
                      {getOrderItemName(item)} {tCommon("multiply")}{" "}
                      {item.orderQuantity}
                    </Typography>
                    <Typography variant="body2">
                      {currency}{" "}
                      {(
                        Number(item.unitPrice) * item.orderQuantity
                      ).toLocaleString(locale)}
                    </Typography>
                  </Stack>
                ))}
                {discount > 0 && (
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography variant="body2">
                      {tOrder("complete.summary.discount")}
                      {order.discountCode
                        ? `${tCommon("parenthesisOpen")}${order.discountCode}${tCommon("parenthesisClose")}`
                        : ""}
                    </Typography>
                    <Typography color="primary" variant="body2">
                      -{currency} {discount.toLocaleString(locale)}
                    </Typography>
                  </Stack>
                )}
                <Typography color="text.secondary" variant="body2">
                  {tOrder(`checkout.payment.${order.paymentMethod}`)}
                </Typography>
              </Stack>
            </CustomizedAccordions>
          );
        })}
        {total > 0 && (
          <StyledTablePagination
            ActionsComponent={PaginationActions}
            component="div"
            count={total}
            labelDisplayedRows={({ count, from, to }) =>
              tCommon("pagination.labelDisplayedRows", { count, from, to })
            }
            labelRowsPerPage={tCommon("pagination.labelRowsPerPage")}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={rowsPerPageOptions}
          />
        )}
      </StyledCardContent>
    </FormCard>
  );
};

export default Orders;
