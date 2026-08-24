"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect, useState } from "react";

import { Alert, Stack, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminOrderResponse, ResetInvoicePrintDto } from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const RESET_INVOICE_PRINT_FORM_ID = "reset-invoice-print-form";

interface ResetInvoicePrintDialogContentProps {
  mutate: () => void;
  order: AdminOrderResponse;
  organizationSlug: string;
}

const ResetInvoicePrintDialogContent = ({
  mutate,
  order,
  organizationSlug,
}: ResetInvoicePrintDialogContentProps) => {
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const tOrders = useTranslations("orders");

  const [reason, setReason] = useState("");

  const resetCount = order.invoice?.printResetCount || 0;

  const disabled = !reason.trim();

  useEffect(() => {
    setDialog({ confirmDisabled: disabled });
  }, [disabled, setDialog]);

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (confirmLoading || disabled) return;

    setDialog({ confirmLoading: true });

    try {
      await fetcher(
        `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print`,
        {
          body: JSON.stringify({
            reason: reason.trim(),
          } satisfies ResetInvoicePrintDto),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        },
      );

      enqueueSnackbar(
        tOrders("actions.resetInvoicePrint.success", {
          orderNumber: order.orderNumber,
        }),
        { variant: "success" },
      );

      closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    } finally {
      setDialog({ confirmLoading: false });
      mutate();
    }
  };

  return (
    <Stack
      component="form"
      gap={2}
      id={RESET_INVOICE_PRINT_FORM_ID}
      onSubmit={onSubmit}
    >
      <Alert severity="warning">
        {tOrders.rich("actions.resetInvoicePrint.confirm", {
          bold: (chunks) => <strong>{chunks}</strong>,
          orderNumber: order.orderNumber,
        })}
      </Alert>
      {resetCount > 0 && (
        <Alert severity="info">
          {tOrders("actions.resetInvoicePrint.resetCount", {
            count: resetCount,
          })}
        </Alert>
      )}
      <TextField
        disabled={confirmLoading}
        label={tOrders("actions.resetInvoicePrint.reason.label")}
        onChange={({ target }) => setReason(target.value)}
        placeholder={tOrders("actions.resetInvoicePrint.reason.placeholder")}
        required
        size="small"
        slotProps={{ htmlInput: { maxLength: 100 } }}
        value={reason}
      />
    </Stack>
  );
};

export default ResetInvoicePrintDialogContent;
