"use client";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect, useMemo, useState } from "react";
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
  OrderPaymentMethod,
  OrderRefund,
  OrderRefundPreview,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { type FetchError, fetcher, sendRequest } from "@/utils/fetcher";
import { getRefundedQuantities } from "@/utils/refunds";

import { useOrderItemName } from "@/hooks/useOrderItemName";

export const REFUND_ORDER_FORM_ID = "refund-order-form";

const ECPAY_REFUNDABLE_METHODS: readonly OrderPaymentMethod[] = [
  "ApplePay",
  "Credit",
];

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
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const locale = useLocale();

  const tCommon = useTranslations("common");
  const tOrders = useTranslations("orders");

  const getOrderItemName = useOrderItemName();

  const refundsKey = `/api/organizations/${organizationSlug}/orders/${order.id}/refunds`;

  const {
    data: refunds,
    error,
    isLoading,
    mutate: mutateRefunds,
  } = useSWR<OrderRefund[]>(refundsKey, fetcher);

  const refundedQuantities = useMemo(
    () => getRefundedQuantities(refunds),
    [refunds],
  );

  const [quantities, setQuantities] = useState<Map<string, number>>(new Map());
  const [reason, setReason] = useState("");

  const selected = useMemo(() => {
    if (quantities.size) return quantities;

    return new Map(
      order.items.map((item) => [
        item.id,
        item.orderQuantity - (refundedQuantities.get(item.id) ?? 0),
      ]),
    );
  }, [order.items, quantities, refundedQuantities]);

  const items = [...selected]
    .filter(([, quantity]) => quantity > 0)
    .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

  const { data: preview } = useSWR<OrderRefundPreview>(
    items.length ? [`${refundsKey}/preview`, items] : null,
    ([url, body]: [string, CreateOrderRefundDto["items"]]) =>
      sendRequest<OrderRefundPreview, CreateOrderRefundDto>()(url, {
        arg: { items: body },
      }),
  );

  const disabled = isLoading || !!error || !preview;

  useEffect(() => {
    setDialog({ confirmDisabled: disabled });
  }, [disabled, setDialog]);

  const isEcpayRefund = ECPAY_REFUNDABLE_METHODS.includes(order.paymentMethod);
  const currency = order.items[0]?.priceCurrency || "";

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (confirmLoading || disabled || !preview) return;

    setDialog({ confirmLoading: true });

    try {
      const created = await fetcher<OrderRefund>(refundsKey, {
        body: JSON.stringify({
          ...(preview.isFull ? {} : { items }),
          ...(reason ? { reason } : {}),
        } satisfies CreateOrderRefundDto),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      enqueueSnackbar(
        tOrders("actions.refund.success", {
          amount: `${currency} ${Number(created.amount).toLocaleString(locale)}`,
          orderNumber: order.orderNumber,
        }),
        { variant: "success" },
      );

      if (created.invoiceAction === "failed")
        enqueueSnackbar(
          created.invoiceError
            ? tOrders("actions.refund.invoiceFailedWithReason", {
                reason: created.invoiceError,
              })
            : tOrders("actions.refund.invoiceFailed"),
          { persist: true, variant: "warning" },
        );

      closeDialog();
    } catch (submitError) {
      const isUnconfirmed = (submitError as FetchError).status === 503;

      enqueueSnackbar(getErrorMessage(submitError), {
        persist: isUnconfirmed,
        variant: isUnconfirmed ? "warning" : "error",
      });

      if (isUnconfirmed) closeDialog();
    } finally {
      setDialog({ confirmLoading: false });
      await mutateRefunds();
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
      {!!error && (
        <Alert severity="error">{tOrders("actions.refund.loadFailed")}</Alert>
      )}
      {!isEcpayRefund && (
        <Alert severity="warning">
          {tOrders("actions.refund.manualChannel")}
        </Alert>
      )}
      {preview?.isFull && order.invoice?.status === "issued" && (
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
              {getOrderItemName(item)} {tCommon("multiply")} {remaining}
            </Typography>
            <TextField
              disabled={!remaining || confirmLoading}
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
        disabled={confirmLoading}
        label={tOrders("actions.refund.reason")}
        onChange={({ target }) => setReason(target.value)}
        size="small"
        slotProps={{ htmlInput: { maxLength: 50 } }}
        value={reason}
      />
      <Divider />
      {!!preview?.allocatedDiscount && (
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
          {currency} {(preview?.amount ?? 0).toLocaleString(locale)}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RefundOrderDialogContent;
