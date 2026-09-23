"use client";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import useSWR from "swr";

import {
  INVOICE_STATUS_COLORS,
  REFUND_STATUS_COLORS,
  STATUS_COLORS,
} from "@/constants/orders";

import { useFormatMoney } from "@/hooks/useFormatMoney";
import { useOrderItemName } from "@/hooks/useOrderItemName";

import { Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type {
  OrderInvoiceVerification,
  OrderPaymentNotification,
  OrderRefund,
  OrderResponse,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const InfoRowStack = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const ValueTypography = styled(Typography)({
  wordBreak: "break-all",
});

const SectionStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}));

const BoldTypography = styled(Typography)({
  fontWeight: "bold",
});

const DetailStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}));

const InvoiceActionsStack = styled(Stack)(({ theme }) => ({
  alignItems: "flex-start",
  gap: theme.spacing(1),
}));

const EntryStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(0.5),
}));

const EntryRowStack = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

const AmountTypography = styled(Typography)({
  flexShrink: 0,
});

const NotificationStack = styled(Stack)(({ theme }) => ({
  alignItems: "flex-end",
  gap: theme.spacing(0.5),
}));

const ItemRowStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
  justifyContent: "space-between",
}));

const TotalStack = styled(Stack)({
  alignItems: "center",
  justifyContent: "space-between",
});

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <InfoRowStack direction="row">
    <Typography color="textSecondary" variant="body2">
      {label}
    </Typography>
    {typeof value === "string" ? (
      <ValueTypography variant="body2">{value}</ValueTypography>
    ) : (
      value
    )}
  </InfoRowStack>
);

const Section = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => (
  <SectionStack>
    <BoldTypography color="textSecondary" variant="subtitle2">
      {title}
    </BoldTypography>
    {children}
  </SectionStack>
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

  const formatMoney = useFormatMoney();

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

  const { data: notifications } = useSWR<OrderPaymentNotification[]>(
    organizationSlug
      ? `/api/organizations/${organizationSlug}/orders/${order.id}/payment-notifications`
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
    <DetailStack divider={<Divider />}>
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
            value={tOrder("mode.dineIn.partySize.select.value", {
              count: order.partySize,
            })}
          />
        )}
        {order.pickupTime && (
          <InfoRow
            label={tOrders("pickupTime")}
            value={format.dateTime(new Date(order.pickupTime), "short")}
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
            <InvoiceActionsStack>
              <Button
                loading={verifying}
                onClick={handleVerifyInvoice}
                size="small"
                variant="outlined"
              >
                {tOrders("detail.invoice.verification.label")}
              </Button>
              {!!verification && (
                <EntryStack>
                  <Typography
                    color={verification.matchesLocal ? "success" : "error"}
                    variant="body2"
                  >
                    {tOrders(
                      verification.matchesLocal
                        ? "detail.invoice.verification.matched"
                        : "detail.invoice.verification.mismatched",
                    )}
                  </Typography>
                  {verification.invalidated && (
                    <Typography color="textSecondary" variant="body2">
                      {tOrders("detail.invoice.verification.invalidated")}
                    </Typography>
                  )}
                  <Typography color="textSecondary" variant="body2">
                    {tOrders(
                      verification.uploaded
                        ? "detail.invoice.verification.uploaded"
                        : "detail.invoice.verification.notUploaded",
                    )}
                  </Typography>
                  {!verification.matchesLocal && (
                    <>
                      <InfoRow
                        label={tOrders(
                          "detail.invoice.verification.invoiceNumber",
                        )}
                        value={verification.invoiceNumber}
                      />
                      <InfoRow
                        label={tOrders(
                          "detail.invoice.verification.invoiceDate",
                        )}
                        value={verification.invoiceDate}
                      />
                      <InfoRow
                        label={tOrders(
                          "detail.invoice.verification.salesAmount",
                        )}
                        value={formatMoney(
                          Number(verification.salesAmount),
                          currency,
                        )}
                      />
                    </>
                  )}
                </EntryStack>
              )}
            </InvoiceActionsStack>
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
            <EntryStack key={refund.id}>
              <EntryRowStack direction="row">
                <Typography variant="body2">
                  {tOrders(`detail.refunds.scope.${refund.scope}`)}
                  {tCommon("parenthesisOpen")}
                  {tOrders(`detail.refunds.channel.${refund.channel}`)}
                  {tCommon("parenthesisClose")}
                </Typography>
                <AmountTypography color="error" variant="body2">
                  -{formatMoney(Number(refund.amount), currency)}
                </AmountTypography>
              </EntryRowStack>
              <InfoRow
                label={format.dateTime(new Date(refund.createdAt), "short")}
                value={
                  <EntryStack direction="row">
                    <Chip
                      color={REFUND_STATUS_COLORS[refund.status]}
                      label={tOrders(`detail.refunds.status.${refund.status}`)}
                      size="small"
                    />
                    <Chip
                      color={
                        refund.invoiceAction === "failed" ? "error" : "default"
                      }
                      label={tOrders(
                        `detail.refunds.invoiceAction.${refund.invoiceAction ?? "pending"}`,
                      )}
                      size="small"
                    />
                  </EntryStack>
                }
              />
              {!!refund.reason && (
                <InfoRow
                  label={tOrders("detail.refunds.reason")}
                  value={refund.reason}
                />
              )}
              {!!refund.allowanceNo && (
                <InfoRow
                  label={tOrders("detail.refunds.allowanceNo")}
                  value={refund.allowanceNo}
                />
              )}
              {!!refund.invoiceError && (
                <InfoRow
                  label={tOrders("detail.refunds.invoiceError")}
                  value={refund.invoiceError}
                />
              )}
            </EntryStack>
          ))}
        </Section>
      )}
      {!!notifications?.length && (
        <Section title={tOrders("detail.notifications.title")}>
          {notifications.map((notification) => (
            <InfoRow
              key={notification.id}
              label={format.dateTime(new Date(notification.createdAt), "short")}
              value={
                <NotificationStack>
                  <Typography variant="body2">
                    {tOrders(
                      `detail.notifications.endpoint.${notification.endpoint}`,
                    )}
                  </Typography>
                  <Chip
                    color={
                      !notification.macValid
                        ? "error"
                        : notification.handled
                          ? "success"
                          : "default"
                    }
                    label={tOrders(
                      !notification.macValid
                        ? "detail.notifications.failed"
                        : notification.handled
                          ? "detail.notifications.handled"
                          : "detail.notifications.unhandled",
                    )}
                    size="small"
                  />
                  {!!notification.error && (
                    <Typography color="error" variant="caption">
                      {notification.error}
                    </Typography>
                  )}
                </NotificationStack>
              }
            />
          ))}
        </Section>
      )}
      <Section title={tOrders("detail.items.title")}>
        {order.items.map((item) => (
          <ItemRowStack direction="row" key={item.id}>
            <Typography variant="body2">
              {getOrderItemName(item)} {tCommon("multiply")}{" "}
              {item.orderQuantity}
            </Typography>
            <AmountTypography variant="body2">
              {formatMoney(
                Number(item.unitPrice) * item.orderQuantity,
                item.priceCurrency,
              )}
            </AmountTypography>
          </ItemRowStack>
        ))}
        {discount > 0 && (
          <ItemRowStack direction="row">
            <Typography variant="body2">
              {tOrders("detail.discount")}
              {order.discountCode
                ? `${tCommon("parenthesisOpen")}${order.discountCode}${tCommon("parenthesisClose")}`
                : ""}
            </Typography>
            <AmountTypography color="primary" variant="body2">
              -{formatMoney(discount, currency)}
            </AmountTypography>
          </ItemRowStack>
        )}
        <Divider />
        <TotalStack direction="row">
          <BoldTypography variant="subtitle1">
            {tOrders("detail.total")}
          </BoldTypography>
          <BoldTypography color="primary" variant="h6">
            {formatMoney(totalAmount, currency)}
          </BoldTypography>
        </TotalStack>
      </Section>
    </DetailStack>
  );
};

export default OrderDetailDialog;
