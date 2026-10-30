"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import type { BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import { type VoidInvoiceForm, useVoidInvoiceFormSchema } from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField } from "@mui/material";

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

  const voidInvoiceFormSchema = useVoidInvoiceFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<VoidInvoiceForm>({
    defaultValues: { customerIdentifier: "", customerName: "", reason: "" },
    resolver: zodResolver(voidInvoiceFormSchema),
  });

  const onSubmitHandler = async ({
    customerIdentifier,
    customerName,
    reason,
  }: VoidInvoiceForm) => {
    setDialog({ confirmLoading: true });

    try {
      await fetcher(
        `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/void`,
        {
          body: JSON.stringify({
            customerIdentifier: customerIdentifier || undefined,
            customerName: customerName || undefined,
            reason,
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

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id={VOID_INVOICE_FORM_ID} onSubmit={onSubmit}>
      <Alert severity="warning">
        {tOrders.rich("actions.voidInvoice.confirm", {
          bold: (chunks) => <strong>{chunks}</strong>,
          invoiceNumber: order.invoice?.invoiceNumber || "",
        })}
      </Alert>
      <TextField
        disabled={confirmLoading}
        error={!!errors.reason}
        helperText={errors.reason?.message}
        label={tOrders("actions.voidInvoice.reason.label")}
        placeholder={tOrders("actions.voidInvoice.reason.placeholder")}
        required
        size="small"
        slotProps={{ htmlInput: { maxLength: 20 } }}
        {...register("reason")}
      />
      <TextField
        disabled={confirmLoading}
        error={!!errors.customerIdentifier}
        helperText={
          errors.customerIdentifier?.message ||
          tOrders("actions.voidInvoice.customerIdentifier.helperText")
        }
        label={tOrders("actions.voidInvoice.customerIdentifier.label")}
        size="small"
        slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 8 } }}
        {...register("customerIdentifier")}
      />
      <TextField
        disabled={confirmLoading}
        helperText={tOrders("actions.voidInvoice.customerName.helperText")}
        label={tOrders("actions.voidInvoice.customerName.label")}
        size="small"
        slotProps={{ htmlInput: { maxLength: 60 } }}
        {...register("customerName")}
      />
    </FormBox>
  );
};

export default VoidInvoiceDialogContent;
