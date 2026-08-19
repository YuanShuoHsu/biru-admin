"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import useSWR from "swr";

import { INVOICE_STATUS_COLORS, STATUS_COLORS } from "@/constants/orders";

import { useOrderItemName } from "@/hooks/useOrderItemName";

import { Button, Chip, Divider, Stack, Typography } from "@mui/material";

import type {
  OrderInvoiceVerification,
  OrderRefund,
  OrderResponse,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

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

const Section = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => (
  <Stack gap={1}>
    <Typography color="text.secondary" fontWeight="bold" variant="subtitle2">
      {title}
    </Typography>
    {children}
  </Stack>
);

interface OrderDetailDialogProps {
  order: OrderResponse;
  organizationSlug?: string;
}

const OrderDetailDialog = ({
  order,
  organizationSlug,
}: OrderDetailDialogProps) => {
  const format = useFormatter();

  const locale = useLocale();

  const getOrderItemName = useOrderItemName();

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");
  const tOrders = useTranslations("orders");

  const { data: refunds } = useSWR<OrderRefund[]>(
    organizationSlug
      ? `/api/organizations/${organizationSlug}/orders/${order.id}/refunds`
      : null,
    fetcher,
  );

  const [verification, setVerification] =
    useState<OrderInvoiceVerification | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerifyInvoice = async () => {
    setVerifying(true);

    try {
      setVerification(
        await fetcher<OrderInvoiceVerification>(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/verification`,
        ),
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const currency = order.items[0]?.priceCurrency || "";
  const discount = Number(order.discount || 0);
  const totalAmount = Number(order.total);

  return (
    <Stack divider={<Divider />} gap={2}>
      <Section title={tOrders("detail.customer.title")}>
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
      </Section>
      <Section title={tOrders("detail.transaction.title")}>
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
        {!!order.tableNumber && (
          <InfoRow
            label={tOrders("tableNumber")}
            value={String(order.tableNumber)}
          />
        )}
        {!!order.partySize && (
          <InfoRow
            label={tOrders("partySize")}
            value={tOrder(
              "mode.dineIn.storeSlug.tableNumber.partySize.select.value",
              { count: order.partySize },
            )}
          />
        )}
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
      </Section>
      {order.invoice && (
        <Section title={tOrders("detail.invoice.title")}>
          <InfoRow
            label={tOrders("detail.invoice.status")}
            value={
              <Chip
                color={INVOICE_STATUS_COLORS[order.invoice.status]}
                label={tOrders(`invoiceStatusValue.${order.invoice.status}`)}
                size="small"
                variant="outlined"
              />
            }
          />
          {order.invoice.invoiceNumber && (
            <InfoRow
              label={tOrders("detail.invoice.invoiceNumber")}
              value={order.invoice.invoiceNumber}
            />
          )}
          {order.invoice.invoiceDate && (
            <InfoRow
              label={tOrders("detail.invoice.invoiceDate")}
              value={format.dateTime(
                new Date(order.invoice.invoiceDate),
                "short",
              )}
            />
          )}
          {order.invoice.printedAt && (
            <InfoRow
              label={tOrders("detail.invoice.printedAt")}
              value={format.dateTime(
                new Date(order.invoice.printedAt),
                "short",
              )}
            />
          )}
          {!!organizationSlug && !!order.invoice.invoiceNumber && (
            <Stack alignItems="flex-start" gap={1}>
              <Button
                loading={verifying}
                onClick={handleVerifyInvoice}
                size="small"
                variant="outlined"
              >
                {tOrders("detail.invoice.verification.label")}
              </Button>
              {!!verification && (
                <Stack gap={0.5}>
                  <Typography
                    color={
                      verification.matchesLocal ? "success.main" : "error.main"
                    }
                    variant="body2"
                  >
                    {tOrders(
                      verification.matchesLocal
                        ? "detail.invoice.verification.matched"
                        : "detail.invoice.verification.mismatched",
                    )}
                  </Typography>
                  {verification.invalidated && (
                    <Typography color="text.secondary" variant="body2">
                      {tOrders("detail.invoice.verification.invalidated")}
                    </Typography>
                  )}
                  <Typography color="text.secondary" variant="body2">
                    {tOrders(
                      verification.uploaded
                        ? "detail.invoice.verification.uploaded"
                        : "detail.invoice.verification.notUploaded",
                    )}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
          <InfoRow
            label={tOrder("checkout.invoice.title")}
            value={tOrder(`checkout.invoice.${order.invoice.type}`)}
          />
          {order.invoice.carrierType && (
            <InfoRow
              label={tOrder("checkout.invoice.carrierType.label")}
              value={tOrder(`checkout.invoice.${order.invoice.carrierType}`)}
            />
          )}
          {order.invoice.carrierNum && (
            <InfoRow
              label={tOrder("checkout.invoice.carrierNum")}
              value={order.invoice.carrierNum}
            />
          )}
          {order.invoice.customerIdentifier && (
            <InfoRow
              label={tOrder("checkout.invoice.customerIdentifier")}
              value={order.invoice.customerIdentifier}
            />
          )}
          {order.invoice.customerName && (
            <InfoRow
              label={tOrder("checkout.invoice.customerName")}
              value={order.invoice.customerName}
            />
          )}
          {order.invoice.customerAddr && (
            <InfoRow
              label={tOrder("checkout.invoice.customerAddr")}
              value={order.invoice.customerAddr}
            />
          )}
          {order.invoice.donateCode && (
            <InfoRow
              label={tOrder("checkout.invoice.donateCode.label")}
              value={order.invoice.donateCode}
            />
          )}
        </Section>
      )}
      {!!refunds?.length && (
        <Section title={tOrders("detail.refunds.title")}>
          {refunds.map((refund) => (
            <Stack gap={0.5} key={refund.id}>
              <Stack direction="row" justifyContent="space-between" gap={2}>
                <Typography variant="body2">
                  {tOrders(`detail.refunds.scope.${refund.scope}`)}
                  {tCommon("parenthesisOpen")}
                  {tOrders(`detail.refunds.channel.${refund.channel}`)}
                  {tCommon("parenthesisClose")}
                </Typography>
                <Typography color="error" flexShrink={0} variant="body2">
                  -{currency} {Number(refund.amount).toLocaleString(locale)}
                </Typography>
              </Stack>
              <InfoRow
                label={format.dateTime(new Date(refund.createdAt), "short")}
                value={
                  <Chip
                    color={
                      refund.invoiceAction === "failed" ? "error" : "default"
                    }
                    label={tOrders(
                      `detail.refunds.invoiceAction.${refund.invoiceAction}`,
                    )}
                    size="small"
                  />
                }
              />
              {!!refund.reason && (
                <InfoRow
                  label={tOrders("detail.refunds.reason")}
                  value={refund.reason}
                />
              )}
            </Stack>
          ))}
        </Section>
      )}
      <Section title={tOrders("detail.items.title")}>
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
      </Section>
    </Stack>
  );
};

export default OrderDetailDialog;
