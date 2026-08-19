"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useMemo, useState } from "react";
import useSWR from "swr";

import {
  Alert,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  AdminOrderResponse,
  CreateOrderRefundDto,
  OrderRefund,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { getRefundPreview, getRefundedQuantities } from "@/utils/refunds";

import { useOrderItemName } from "@/hooks/useOrderItemName";

export const REFUND_ORDER_FORM_ID = "refund-order-form";

// 綠界的請退款 API 只支援信用卡，其餘付款方式必須由店家自行退款
const ECPAY_REFUNDABLE_METHODS = ["ApplePay", "Credit"];

interface RefundOrderDialogContentProps {
  mutate: () => void;
  order: AdminOrderResponse;
  organizationSlug: string;
}

const RefundOrderDialogContent = ({
  mutate,
  order,
  organizationSlug,
}: RefundOrderDialogContentProps) => {
  const { closeDialog } = useDialogStore((state) => state);

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const getOrderItemName = useOrderItemName();

  const { data: refunds, isLoading } = useSWR<OrderRefund[]>(
    `/api/organizations/${organizationSlug}/orders/${order.id}/refunds`,
    fetcher,
  );

  const refundedQuantities = useMemo(
    () => getRefundedQuantities(refunds),
    [refunds],
  );

  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 未選過時預設整單退款，這是最常見的情境
  const selected = useMemo(() => {
    if (quantities.size) return quantities;

    return new Map(
      order.items.map((item) => [
        item.id,
        item.orderQuantity - (refundedQuantities.get(item.id) ?? 0),
      ]),
    );
  }, [order.items, quantities, refundedQuantities]);

  const preview = useMemo(
    () => getRefundPreview(order, refundedQuantities, selected),
    [order, refundedQuantities, selected],
  );

  const isEcpayRefund = ECPAY_REFUNDABLE_METHODS.includes(order.paymentMethod);
  const currency = order.items[0]?.priceCurrency || "";

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (preview.amount <= 0) return;

    setSubmitting(true);

    try {
      const items = [...selected]
        .filter(([, quantity]) => quantity > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

      const created = await fetcher<OrderRefund>(
        `/api/organizations/${organizationSlug}/orders/${order.id}/refunds`,
        {
          body: JSON.stringify({
            ...(preview.isFull ? {} : { items }),
            ...(reason ? { reason } : {}),
          } satisfies CreateOrderRefundDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      enqueueSnackbar(
        tOrders("actions.refund.success", {
          amount: Number(created.amount).toLocaleString(locale),
          orderNumber: order.orderNumber,
        }),
        { variant: "success" },
      );

      if (created.invoiceAction === "failed")
        enqueueSnackbar(tOrders("actions.refund.invoiceFailed"), {
          variant: "warning",
        });

      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setSubmitting(false);
      mutate();
    }
  };

  return (
    <Stack
      component="form"
      gap={2}
      id={REFUND_ORDER_FORM_ID}
      onSubmit={onSubmit}
    >
      {!isEcpayRefund && (
        <Alert severity="warning">
          {tOrders("actions.refund.manualChannel")}
        </Alert>
      )}
      {preview.isFull && (
        <Alert severity="info">{tOrders("actions.refund.invoiceHint")}</Alert>
      )}
      <Typography variant="body2">
        {tOrders("actions.refund.itemsLabel")}
      </Typography>
      {order.items.map((item) => {
        const remaining =
          item.orderQuantity - (refundedQuantities.get(item.id) ?? 0);

        return (
          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            justifyContent="space-between"
            key={item.id}
          >
            <Typography
              color={remaining ? "text.primary" : "text.disabled"}
              variant="body2"
            >
              {getOrderItemName(item)} {tCommon("multiply")}{" "}
              {item.orderQuantity}
            </Typography>
            <TextField
              disabled={!remaining || submitting || isLoading}
              onChange={({ target }) =>
                setQuantities(
                  new Map(selected).set(item.id, Number(target.value)),
                )
              }
              select
              size="small"
              slotProps={{
                htmlInput: { "aria-label": getOrderItemName(item) },
              }}
              sx={{ minWidth: 88 }}
              value={Math.min(selected.get(item.id) ?? 0, remaining)}
            >
              {Array.from({ length: remaining + 1 }, (_, index) => (
                <MenuItem key={index} value={index}>
                  {index}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        );
      })}
      <TextField
        disabled={submitting}
        label={tOrders("actions.refund.reason")}
        onChange={({ target }) => setReason(target.value)}
        size="small"
        slotProps={{ htmlInput: { maxLength: 50 } }}
        value={reason}
      />
      <Divider />
      {preview.allocatedDiscount > 0 && (
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2">
            {tOrders("actions.refund.allocatedDiscount")}
          </Typography>
          <Typography variant="body2">
            -{currency} {preview.allocatedDiscount.toLocaleString(locale)}
          </Typography>
        </Stack>
      )}
      <Stack alignItems="center" direction="row" justifyContent="space-between">
        <Typography fontWeight="bold" variant="subtitle1">
          {tOrders("actions.refund.amount")}
        </Typography>
        <Typography color="error" fontWeight="bold" variant="h6">
          {currency} {preview.amount.toLocaleString(locale)}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RefundOrderDialogContent;
