"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { type BaseSyntheticEvent, useEffect, useState } from "react";

import { Alert, Stack, TextField } from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type { AdminOrderResponse, VoidInvoiceDto } from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

export const VOID_INVOICE_FORM_ID = "void-invoice-form";

interface VoidInvoiceDialogContentProps {
  mutate: () => void;
  order: AdminOrderResponse;
  organizationSlug: string;
}

const VoidInvoiceDialogContent = ({
  mutate,
  order,
  organizationSlug,
}: VoidInvoiceDialogContentProps) => {
  const { closeDialog, confirmLoading, setDialog } = useDialogStore(
    (state) => state,
  );

  const tOrders = useTranslations("orders");

  const [reason, setReason] = useState("");
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [customerName, setCustomerName] = useState("");

  const taxId = customerIdentifier.trim();
  const invalidTaxId = !!taxId && !/^\d{8}$/.test(taxId);

  const disabled = !reason.trim() || invalidTaxId;

  useEffect(() => {
    setDialog({ confirmDisabled: disabled });
  }, [disabled, setDialog]);

  const onSubmit = async (event: BaseSyntheticEvent) => {
    event.preventDefault();

    if (confirmLoading || disabled) return;

    setDialog({ confirmLoading: true });

    try {
      await fetcher(
        `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/void`,
        {
          body: JSON.stringify({
            customerIdentifier: taxId || undefined,
            customerName: customerName.trim() || undefined,
            reason: reason.trim(),
          } satisfies VoidInvoiceDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      enqueueSnackbar(
        tOrders("actions.voidInvoice.success", {
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
      id={VOID_INVOICE_FORM_ID}
      onSubmit={onSubmit}
    >
      <Alert severity="warning">
        {tOrders.rich("actions.voidInvoice.confirm", {
          bold: (chunks) => <strong>{chunks}</strong>,
          invoiceNumber: order.invoice?.invoiceNumber || "",
        })}
      </Alert>
      <TextField
        disabled={confirmLoading}
        label={tOrders("actions.voidInvoice.reason.label")}
        onChange={({ target }) => setReason(target.value)}
        placeholder={tOrders("actions.voidInvoice.reason.placeholder")}
        required
        size="small"
        slotProps={{ htmlInput: { maxLength: 20 } }}
        value={reason}
      />
      <TextField
        disabled={confirmLoading}
        error={invalidTaxId}
        helperText={
          invalidTaxId
            ? tOrders("actions.voidInvoice.customerIdentifier.invalid")
            : tOrders("actions.voidInvoice.customerIdentifier.helperText")
        }
        label={tOrders("actions.voidInvoice.customerIdentifier.label")}
        onChange={({ target }) => setCustomerIdentifier(target.value)}
        size="small"
        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
        value={customerIdentifier}
      />
      <TextField
        disabled={confirmLoading}
        helperText={tOrders("actions.voidInvoice.customerName.helperText")}
        label={tOrders("actions.voidInvoice.customerName.label")}
        onChange={({ target }) => setCustomerName(target.value)}
        size="small"
        slotProps={{ htmlInput: { maxLength: 60 } }}
        value={customerName}
      />
    </Stack>
  );
};

export default VoidInvoiceDialogContent;
