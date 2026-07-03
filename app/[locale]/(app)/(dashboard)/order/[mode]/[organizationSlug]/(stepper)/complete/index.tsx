"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useSnackbar } from "notistack";

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
  Box,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { StyledCardContent } from "@/components/FormCard";
import LocationDetails from "@/components/LocationDetails";

import { ORDER_MODE } from "@/constants/orderMode";

import type { OrganizationResponse } from "@/types/organizations";
import type { PaymentMethod } from "@/types/payment";

// TODO: 接上綠界 OrderResultURL / 後端訂單資料後，改為讀取真實交易結果
const MOCK_TRANSACTION = {
  card4No: "4242",
  currency: "NT$",
  estimatedPickupTime: "15:05",
  isSuccess: true,
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
    alignItems="center"
    direction="row"
    gap={1}
    justifyContent="space-between"
  >
    <Typography color="text.secondary" flexShrink={0} variant="body2">
      {label}
    </Typography>
    <Stack alignItems="center" direction="row" gap={0.5} minWidth={0}>
      {typeof value === "string" ? (
        <Typography
          fontWeight={500}
          sx={{ wordBreak: "break-all" }}
          variant="body2"
        >
          {value}
        </Typography>
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

  const StatusIcon = isSuccess ? CheckCircleOutline : ErrorOutline;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(merchantTradeNo);

    enqueueSnackbar(tOrder("complete.copied"), { variant: "success" });
  };

  return (
    <Stack gap={2} pb={4}>
      <Card variant="outlined">
        <StyledCardContent>
          <Box textAlign="center">
            <StatusIcon
              sx={{
                color: isSuccess ? "success.main" : "error.main",
                fontSize: 56,
                mb: 1,
              }}
            />
            <Typography fontWeight="bold" gutterBottom variant="h5">
              {tOrder(
                isSuccess ? "complete.success.title" : "complete.failure.title",
              )}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {tOrder(
                isSuccess
                  ? "complete.success.subtitle"
                  : "complete.failure.subtitle",
              )}
            </Typography>
          </Box>
        </StyledCardContent>
      </Card>
      {isSuccess && (
        <>
          <Card variant="outlined">
            <StyledCardContent>
              <Box textAlign="center">
                <Typography
                  color="text.secondary"
                  letterSpacing={2}
                  variant="overline"
                >
                  {tOrder("complete.pickupNumber")}
                </Typography>
                <Typography color="primary" fontWeight="bold" variant="h2">
                  {pickupNumber}
                </Typography>
              </Box>
              <Alert
                icon={<AccessTime fontSize="inherit" />}
                severity="info"
                sx={{ justifyContent: "center" }}
              >
                {tOrder("complete.estimatedPickupTime", {
                  time: estimatedPickupTime,
                })}
              </Alert>
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
        {isSuccess ? (
          <Button
            fullWidth
            onClick={() =>
              router.push(`/order/${mode}/${organizationSlug}${query}`)
            }
            startIcon={<MenuBook />}
            variant="contained"
          >
            {tOrder("complete.backToMenu")}
          </Button>
        ) : (
          <>
            <Button
              fullWidth
              onClick={() =>
                router.push(`/order/${mode}/${organizationSlug}${query}`)
              }
              startIcon={<MenuBook />}
              variant="outlined"
            >
              {tOrder("cart.back")}
            </Button>
            <Button
              fullWidth
              onClick={() =>
                router.push(
                  `/order/${mode}/${organizationSlug}/checkout${query}`,
                )
              }
              variant="contained"
            >
              {tOrder("complete.failure.retry")}
            </Button>
          </>
        )}
      </Stack>
    </Stack>
  );
};

export default OrderModeOrganizationSlugComplete;
