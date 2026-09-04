"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import CustomizedAccordions from "@/components/CustomizedAccordions";
import FormCard, {
  StyledCardContent,
  StyledCardHeader,
} from "@/components/FormCard";
import PaginationActions, {
  StyledTablePagination,
} from "@/components/PaginationActions";

import { MODE_COLORS } from "@/constants/orderMode";
import { STATUS_COLORS } from "@/constants/orders";
import { getPageSizeOptions } from "@/constants/pagination";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useOrderItemName } from "@/hooks/useOrderItemName";
import { useOrderModeLabel } from "@/hooks/useOrderModeLabel";

import { usePathname, useRouter } from "@/i18n/navigation";

import { Chip, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { UserOrderListResponse } from "@/types/orders";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const StyledChip = styled(Chip)({
  alignSelf: "flex-start",
});

interface OrdersProps {
  orders: UserOrderListResponse | null;
  page: number;
  pageSize: number;
}

const Orders = ({ orders: data, page, pageSize }: OrdersProps) => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const getOrderItemName = useOrderItemName();

  const getOrderModeLabel = useOrderModeLabel();

  const locale = useLocale();

  const pathname = usePathname();

  const router = useRouter();

  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const orders = data?.data || [];
  const rowsPerPageOptions = getPageSizeOptions(pageSize);
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

  return (
    <FormCard>
      <StyledCardHeader
        title={
          <Typography color="primary" fontWeight="bold" variant="h6">
            {tAuth("orders.label")}
          </Typography>
        }
      />
      <StyledCardContent>
        {orders.length === 0 && (
          <Typography color="text.secondary" variant="body2">
            {tAuth("orders.empty")}
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
                      color={STATUS_COLORS[order.orderStatus]}
                      label={tAuth(`orders.status.${order.orderStatus}`)}
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
                        .tz(STORE_TIMEZONE)
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
                <StyledChip
                  color={MODE_COLORS[order.mode]}
                  label={getOrderModeLabel(order.mode, order.tableNumber)}
                  size="small"
                  variant="outlined"
                />
                {order.pickupTime && (
                  <Typography color="text.secondary" variant="caption">
                    {tOrder("complete.transaction.pickupTime")}{" "}
                    {dayjs(order.pickupTime)
                      .tz(STORE_TIMEZONE)
                      .format("YYYY/MM/DD HH:mm")}
                  </Typography>
                )}
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
                {order.invoice?.invoiceNumber && (
                  <Typography color="text.secondary" variant="caption">
                    {tOrder("complete.invoice.invoiceNumber")}{" "}
                    {order.invoice.invoiceNumber}
                  </Typography>
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
