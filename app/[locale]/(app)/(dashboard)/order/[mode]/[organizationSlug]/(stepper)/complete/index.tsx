"use client";

import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { menuSocket } from "@/app/socket";

import { StyledCardContent } from "@/components/FormCard";
import LocationDetails from "@/components/LocationDetails";

import { localeConfigs } from "@/constants/locale";
import { ORDER_MODE } from "@/constants/orderMode";
import { INVOICE_STATUS_COLORS } from "@/constants/orders";
import { STORE_TIMEZONE } from "@/constants/timezone";

import { useOrderItemName } from "@/hooks/useOrderItemName";
import { useSocketConnection } from "@/hooks/useSocketConnection";

import { useRouter } from "@/i18n/navigation";

import { useCartStore } from "@/providers/cart-store-provider";

import {
  CheckCircleOutline,
  ContentCopy,
  ErrorOutline,
  HourglassEmpty,
  MenuBook,
} from "@mui/icons-material";
import {
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type CSSObject, styled } from "@mui/material/styles";

import type { CheckoutEcpayDto, CheckoutEcpayResponse } from "@/types/ecpay";
import type { OrderResponse } from "@/types/orders";
import type { OrganizationResponse } from "@/types/organizations";

import { submitEcpayCheckout } from "@/utils/ecpay";
import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const statusIconStyle: CSSObject = {
  alignSelf: "center",
  fontSize: 56,
};

const StyledCheckCircleOutline = styled(CheckCircleOutline)(statusIconStyle);

const StyledErrorOutline = styled(ErrorOutline)(statusIconStyle);

const StyledHourglassEmpty = styled(HourglassEmpty)(statusIconStyle);

const STATUS_ICON = {
  error: StyledErrorOutline,
  pending: StyledHourglassEmpty,
  success: StyledCheckCircleOutline,
} as const;

const StyledTypography = styled(Typography)({
  wordBreak: "break-all",
});

const SUCCESS_ORDER_STATUSES: OrderResponse["orderStatus"][] = [
  "OrderDelivered",
  "OrderPickupAvailable",
  "OrderProcessing",
];

const InfoRow = ({
  action,
  label,
  value,
}: {
  action?: React.ReactNode;
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
    <Stack direction="row" alignItems="center" gap={1}>
      {typeof value === "string" ? (
        <StyledTypography variant="body2">{value}</StyledTypography>
      ) : (
        value
      )}
      {action}
    </Stack>
  </Stack>
);

interface OrderModeOrganizationSlugCompleteProps {
  order: OrderResponse | null;
  organization: OrganizationResponse | null;
}

const OrderModeOrganizationSlugComplete = ({
  order: initialOrder,
  organization,
}: OrderModeOrganizationSlugCompleteProps) => {
  const { cartKey, clearCart, lastOrderId, setLastOrderId } = useCartStore(
    (state) => state,
  );

  const locale = useLocale();

  const getOrderItemName = useOrderItemName();

  const { enqueueSnackbar } = useSnackbar();

  const { mode, organizationSlug } = useParams<{
    mode: string;
    organizationSlug: string;
  }>();

  const router = useRouter();

  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const menuSearchParams = new URLSearchParams(searchParams);
  menuSearchParams.delete("orderId");
  const menuQuery = menuSearchParams.size ? `?${menuSearchParams}` : "";

  const { data: order = initialOrder, mutate } = useSWR<OrderResponse | null>(
    orderId ? `/api/organizations/${organizationSlug}/orders/${orderId}` : null,
    { fallbackData: initialOrder },
  );

  const { isConnected } = useSocketConnection(menuSocket);

  useEffect(() => {
    if (!isConnected || !orderId) return;

    const handleOrderStatusUpdated = () => {
      mutate();
    };

    menuSocket
      .timeout(5000)
      .emitWithAck("joinOrder", { orderId })
      .then(handleOrderStatusUpdated)
      .catch(() => {});

    menuSocket.on("orderStatusUpdated", handleOrderStatusUpdated);

    return () => {
      menuSocket.off("orderStatusUpdated", handleOrderStatusUpdated);
    };
  }, [isConnected, mutate, orderId]);

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const isSuccess =
    !!order &&
    (order.paymentMethod === "Cash" ||
      SUCCESS_ORDER_STATUSES.includes(order.orderStatus));
  const isPaid = !!order && order.orderStatus !== "OrderPaymentDue";
  const orderNo = order ? order.confirmationNumber || order.orderNumber : "";
  const currency = order?.items[0]?.priceCurrency || "";
  const discount = Number(order?.discount || 0);
  const totalAmount =
    (order?.items || []).reduce(
      (sum, { orderQuantity, unitPrice }) =>
        sum + Number(unitPrice) * orderQuantity,
      0,
    ) - discount;

  const invoice = order?.invoice;
  const showPickupInfo = mode === ORDER_MODE.Pickup && !!organization;

  useEffect(() => {
    if (!cartKey || !isSuccess || order?.id !== lastOrderId) return;

    clearCart();
    setLastOrderId(null);
  }, [cartKey, clearCart, isSuccess, lastOrderId, order?.id, setLastOrderId]);

  const [isPaying, setIsPaying] = useState(false);

  const handleRetryPayment = async () => {
    if (!order) return;

    setIsPaying(true);

    try {
      const completeUrl = window.location.href;

      submitEcpayCheckout(
        await fetcher<CheckoutEcpayResponse>("/api/ecpay", {
          body: JSON.stringify({
            ClientBackURL: completeUrl,
            Language: localeConfigs[locale].ecpayLanguage,
            orderId: order.id,
            TradeDesc: tOrder("checkout.tradeDesc"),
          } satisfies CheckoutEcpayDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }),
      );
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setIsPaying(false);
    }
  };

  // 待付款不是失敗；畫成「付款失敗，請重新結帳」會讓顧客再下一筆單
  const status: keyof typeof STATUS_ICON = isSuccess
    ? "success"
    : order?.orderStatus === "OrderPaymentDue"
      ? "pending"
      : "error";
  const StatusIcon = STATUS_ICON[status];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(orderNo);

    enqueueSnackbar(tOrder("complete.copied"), { variant: "success" });
  };

  const handleCopyInvoiceNumber = async () => {
    await navigator.clipboard.writeText(invoice?.invoiceNumber || "");

    enqueueSnackbar(tOrder("complete.invoice.copied"), { variant: "success" });
  };

  return (
    <>
      <Card variant="outlined">
        <StyledCardContent>
          <StatusIcon color={status === "pending" ? "warning" : status} />
          <Stack>
            <Typography
              fontWeight="bold"
              gutterBottom
              textAlign="center"
              variant="h5"
            >
              {tOrder(`complete.${status}.title`)}
            </Typography>
            <Typography
              color="text.secondary"
              textAlign="center"
              variant="body2"
            >
              {tOrder(`complete.${status}.subtitle`)}
            </Typography>
          </Stack>
          {status === "pending" && order?.paymentMethod !== "Cash" && (
            <Button
              loading={isPaying}
              onClick={handleRetryPayment}
              variant="contained"
            >
              {tOrder("complete.pending.retry")}
            </Button>
          )}
        </StyledCardContent>
      </Card>
      {order && isSuccess && (
        <>
          <Card variant="outlined">
            <StyledCardContent>
              <Stack>
                <Typography
                  color="text.secondary"
                  textAlign="center"
                  variant="caption"
                >
                  {tOrder("complete.pickupNumber")}
                </Typography>
                <Typography
                  color="primary"
                  fontWeight="bold"
                  textAlign="center"
                  variant="h2"
                >
                  {order.orderNumber}
                </Typography>
              </Stack>
            </StyledCardContent>
          </Card>
          {showPickupInfo && organization && (
            <Card variant="outlined">
              <StyledCardContent>
                <Typography
                  color="text.secondary"
                  fontWeight="bold"
                  variant="subtitle2"
                >
                  {tOrder("complete.pickupLocation")}
                </Typography>
                <TextField
                  label={tOrder("organizationSlug.label")}
                  size="small"
                  slotProps={{
                    input: { readOnly: true },
                    inputLabel: { shrink: true },
                  }}
                  sx={{ maxWidth: 240 }}
                  value={organization.name}
                />
                <LocationDetails organization={organization} showMap={false} />
              </StyledCardContent>
            </Card>
          )}
          <Card variant="outlined">
            <StyledCardContent>
              <Typography
                color="text.secondary"
                fontWeight="bold"
                variant="subtitle2"
              >
                {tOrder("complete.summary.title")}
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
              {discount > 0 && (
                <Stack direction="row" justifyContent="space-between" gap={1}>
                  <Typography variant="body2">
                    {tOrder("complete.summary.discount")}
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
                  {tOrder("complete.summary.total")}
                </Typography>
                <Typography color="primary" fontWeight="bold" variant="h6">
                  {currency} {totalAmount.toLocaleString(locale)}
                </Typography>
              </Stack>
            </StyledCardContent>
          </Card>
          <Card variant="outlined">
            <StyledCardContent>
              <Typography
                color="text.secondary"
                fontWeight="bold"
                variant="subtitle2"
              >
                {tOrder("complete.transaction.title")}
              </Typography>
              <InfoRow
                label={tOrder("complete.transaction.status")}
                value={
                  <Chip
                    color={isPaid ? "success" : "warning"}
                    label={tOrder(
                      isPaid
                        ? "complete.transaction.paid"
                        : "complete.transaction.unpaid",
                    )}
                    size="small"
                    variant="outlined"
                  />
                }
              />
              <InfoRow
                action={
                  <IconButton
                    aria-label={tOrder("complete.transaction.orderNo")}
                    onClick={handleCopy}
                    size="small"
                  >
                    <ContentCopy fontSize="inherit" />
                  </IconButton>
                }
                label={tOrder("complete.transaction.orderNo")}
                value={orderNo}
              />
              <InfoRow
                label={tOrder("complete.transaction.mode")}
                value={tOrder(`mode.${order.mode}.label`)}
              />
              {order.pickupTime && (
                <InfoRow
                  label={tOrder("complete.transaction.pickupTime")}
                  value={dayjs(order.pickupTime)
                    .tz(STORE_TIMEZONE)
                    .format("YYYY/MM/DD HH:mm")}
                />
              )}
              {order.tradeNo && (
                <InfoRow
                  label={tOrder("complete.transaction.tradeNo")}
                  value={order.tradeNo}
                />
              )}
              <InfoRow
                label={tOrder("complete.transaction.paymentMethod")}
                value={`${tOrder(`checkout.payment.${order.paymentMethod}`)}${order.paymentMethodId ? ` •••• ${order.paymentMethodId}` : ""}`}
              />
              {order.paymentDate && (
                <InfoRow
                  label={tOrder("complete.transaction.paymentDate")}
                  value={dayjs(order.paymentDate)
                    .tz(STORE_TIMEZONE)
                    .format("YYYY/MM/DD HH:mm:ss")}
                />
              )}
              <InfoRow
                label={tOrder("complete.transaction.amount")}
                value={`${currency} ${totalAmount.toLocaleString(locale)}`}
              />
            </StyledCardContent>
          </Card>
          {invoice && (
            <Card variant="outlined">
              <StyledCardContent>
                <Typography
                  color="text.secondary"
                  fontWeight="bold"
                  variant="subtitle2"
                >
                  {tOrder("complete.invoice.title")}
                </Typography>
                <InfoRow
                  label={tOrder("complete.invoice.status.label")}
                  value={
                    <Chip
                      color={INVOICE_STATUS_COLORS[invoice.status]}
                      label={tOrder(
                        `complete.invoice.status.${invoice.status}`,
                      )}
                      size="small"
                      variant="outlined"
                    />
                  }
                />
                {invoice.invoiceNumber && (
                  <InfoRow
                    action={
                      <IconButton
                        aria-label={tOrder("complete.invoice.invoiceNumber")}
                        onClick={handleCopyInvoiceNumber}
                        size="small"
                      >
                        <ContentCopy fontSize="inherit" />
                      </IconButton>
                    }
                    label={tOrder("complete.invoice.invoiceNumber")}
                    value={invoice.invoiceNumber}
                  />
                )}
                {invoice.invoiceDate && (
                  <InfoRow
                    label={tOrder("complete.invoice.invoiceDate")}
                    value={dayjs(invoice.invoiceDate)
                      .tz(STORE_TIMEZONE)
                      .format("YYYY/MM/DD HH:mm:ss")}
                  />
                )}
                <InfoRow
                  label={tOrder("checkout.invoice.title")}
                  value={tOrder(`checkout.invoice.${invoice.type}`)}
                />
                {invoice.type === "personal" && (
                  <InfoRow
                    label={tOrder("checkout.invoice.carrierType.label")}
                    value={tOrder(
                      `checkout.invoice.${invoice.carrierType || "none"}`,
                    )}
                  />
                )}
                {invoice.carrierNum && (
                  <InfoRow
                    label={tOrder("checkout.invoice.carrierNum")}
                    value={invoice.carrierNum}
                  />
                )}
                {invoice.customerIdentifier && (
                  <InfoRow
                    label={tOrder("checkout.invoice.customerIdentifier")}
                    value={invoice.customerIdentifier}
                  />
                )}
                {invoice.customerName && (
                  <InfoRow
                    label={tOrder("checkout.invoice.customerName")}
                    value={invoice.customerName}
                  />
                )}
                {invoice.donateCode && (
                  <InfoRow
                    label={tOrder("checkout.invoice.donateCode.label")}
                    value={invoice.donateCode}
                  />
                )}
              </StyledCardContent>
            </Card>
          )}
        </>
      )}
      <Button
        fullWidth
        onClick={() =>
          router.push(`/order/${mode}/${organizationSlug}${menuQuery}`)
        }
        startIcon={<MenuBook />}
        variant="contained"
      >
        {tOrder(isSuccess ? "complete.backToMenu" : "cart.back")}
      </Button>
    </>
  );
};

export default OrderModeOrganizationSlugComplete;
