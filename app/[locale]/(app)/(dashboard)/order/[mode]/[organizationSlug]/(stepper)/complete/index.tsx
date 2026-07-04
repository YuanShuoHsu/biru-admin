"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";
import useSWR from "swr";

import { StyledCardContent } from "@/components/FormCard";
import LocationDetails from "@/components/LocationDetails";

import { ORDER_MODE } from "@/constants/orderMode";

import { useRouter } from "@/i18n/navigation";

import {
  CheckCircleOutline,
  ContentCopy,
  ErrorOutline,
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

import type { OrderResponse } from "@/types/orders";
import type { OrganizationResponse } from "@/types/organizations";

const statusIconStyle: CSSObject = {
  alignSelf: "center",
  fontSize: 56,
};

const StyledCheckCircleOutline = styled(CheckCircleOutline)(statusIconStyle);

const StyledErrorOutline = styled(ErrorOutline)(statusIconStyle);

const STATUS_ICON = {
  error: StyledErrorOutline,
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
  organization: OrganizationResponse | null;
}

const OrderModeOrganizationSlugComplete = ({
  organization,
}: OrderModeOrganizationSlugCompleteProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const locale = useLocale();

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

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const { data: order, isLoading } = useSWR<OrderResponse>(
    orderId ? `/api/organizations/${organizationSlug}/orders/${orderId}` : null,
    {
      refreshInterval: (data) =>
        data &&
        data.paymentMethod !== "Cash" &&
        data.orderStatus === "OrderPaymentDue"
          ? 3000
          : 0,
    },
  );

  const isSuccess =
    !!order &&
    (order.paymentMethod === "Cash" ||
      SUCCESS_ORDER_STATUSES.includes(order.orderStatus));
  const isPaid = !!order && order.orderStatus !== "OrderPaymentDue";
  const orderNo = order ? order.confirmationNumber || order.orderNumber : "";
  const currency = order?.items[0]?.priceCurrency || "";
  const totalAmount = (order?.items || []).reduce(
    (sum, { orderQuantity, unitPrice }) =>
      sum + Number(unitPrice) * orderQuantity,
    0,
  );

  const showPickupInfo = mode === ORDER_MODE.Pickup && !!organization;

  const status = isSuccess ? "success" : "error";
  const StatusIcon = STATUS_ICON[status];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(orderNo);

    enqueueSnackbar(tOrder("complete.copied"), { variant: "success" });
  };

  const getOrderItemName = ({
    addOns,
    menuItemName,
    modifiers,
  }: OrderResponse["items"][number]) => {
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

  if (isLoading) return null;

  return (
    <>
      <Card variant="outlined">
        <StyledCardContent>
          <StatusIcon color={status} />
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
                  value={new Date(order.paymentDate).toLocaleString(locale)}
                />
              )}
              <InfoRow
                label={tOrder("complete.transaction.amount")}
                value={`${currency} ${totalAmount.toLocaleString(locale)}`}
              />
            </StyledCardContent>
          </Card>
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
