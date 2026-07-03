"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";

import { StyledCardContent } from "@/components/FormCard";
import LocationDetails from "@/components/LocationDetails";

import { ORDER_MODE } from "@/constants/orderMode";

import { useRouter } from "@/i18n/navigation";

import {
  AccessTime,
  CheckCircleOutline,
  ContentCopy,
  ErrorOutline,
  MenuBook,
} from "@mui/icons-material";
import {
  Alert,
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

import type { OrganizationResponse } from "@/types/organizations";
import type { PaymentMethod } from "@/types/payment";

const StyledAlert = styled(Alert)({
  justifyContent: "center",
});

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

// TODO: 接上綠界 OrderResultURL / 後端訂單資料後，改為讀取真實交易結果
const MOCK_TRANSACTION = {
  card4No: "4242",
  currency: "NT$",
  estimatedPickupTime: "15:05",
  isSuccess: false,
  items: [
    { name: "招牌拿鐵（大杯 / 熱 / 燕麥奶）", quantity: 2, subtotal: 240 },
    { name: "肉桂捲", quantity: 1, subtotal: 120 },
  ],
  merchantTradeNo: "BIRU20260703123456",
  paymentDate: "2026/07/03 14:32",
  paymentType: "Credit" as PaymentMethod,
  pickupNumber: "A102",
  totalAmount: 360,
  tradeNo: "2607031432187654",
};

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
  const search = searchParams.toString();
  const query = search ? `?${search}` : "";

  const tCommon = useTranslations("common");
  const tOrder = useTranslations("order");

  const {
    card4No,
    currency,
    estimatedPickupTime,
    isSuccess,
    items,
    merchantTradeNo,
    paymentDate,
    paymentType,
    pickupNumber,
    totalAmount,
    tradeNo,
  } = MOCK_TRANSACTION;

  const showPickupInfo = mode === ORDER_MODE.Pickup && !!organization;

  const status = isSuccess ? "success" : "error";
  const StatusIcon = STATUS_ICON[status];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(merchantTradeNo);

    enqueueSnackbar(tOrder("complete.copied"), { variant: "success" });
  };

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
      {isSuccess && (
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
                  {pickupNumber}
                </Typography>
              </Stack>
              <StyledAlert
                icon={<AccessTime fontSize="small" />}
                severity="info"
              >
                {tOrder("complete.estimatedPickupTime", {
                  time: estimatedPickupTime,
                })}
              </StyledAlert>
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
              {items.map(({ name, quantity, subtotal }) => (
                <Stack
                  direction="row"
                  gap={1}
                  justifyContent="space-between"
                  key={name}
                >
                  <Typography variant="body2">
                    {name} {tCommon("multiply")} {quantity}
                  </Typography>
                  <Typography flexShrink={0} variant="body2">
                    {currency} {subtotal.toLocaleString(locale)}
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
                    color="success"
                    label={tOrder("complete.transaction.paid")}
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
                value={merchantTradeNo}
              />
              <InfoRow
                label={tOrder("complete.transaction.tradeNo")}
                value={tradeNo}
              />
              <InfoRow
                label={tOrder("complete.transaction.paymentMethod")}
                value={`${tOrder(`checkout.payment.${paymentType}`)} •••• ${card4No}`}
              />
              <InfoRow
                label={tOrder("complete.transaction.paymentDate")}
                value={paymentDate}
              />
              <InfoRow
                label={tOrder("complete.transaction.amount")}
                value={`${currency} ${totalAmount.toLocaleString(locale)}`}
              />
            </StyledCardContent>
          </Card>
        </>
      )}
      <Stack direction="row" gap={2}>
        <Button
          fullWidth
          onClick={() =>
            router.push(`/order/${mode}/${organizationSlug}${query}`)
          }
          startIcon={<MenuBook />}
          variant="contained"
        >
          {tOrder(isSuccess ? "complete.backToMenu" : "cart.back")}
        </Button>
      </Stack>
    </>
  );
};

export default OrderModeOrganizationSlugComplete;
