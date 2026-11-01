"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import type { BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";

import {
  type ResetInvoicePrintForm,
  useResetInvoicePrintFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Alert, TextField } from "@mui/material";

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

  const resetInvoicePrintFormSchema = useResetInvoicePrintFormSchema();

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ResetInvoicePrintForm>({
    defaultValues: { reason: "" },
    resolver: zodResolver(resetInvoicePrintFormSchema),
  });

  const resetCount = order.invoice?.printResetCount || 0;

  const onSubmitHandler = async ({ reason }: ResetInvoicePrintForm) => {
    setDialog({ confirmLoading: true });

    try {
      await fetcher(
        `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print`,
        {
          body: JSON.stringify({ reason } satisfies ResetInvoicePrintDto),
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

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  return (
    <FormBox id={RESET_INVOICE_PRINT_FORM_ID} onSubmit={onSubmit}>
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
        error={!!errors.reason}
        helperText={errors.reason?.message}
        label={tOrders("actions.resetInvoicePrint.reason.label")}
        placeholder={tOrders("actions.resetInvoicePrint.reason.placeholder")}
        required
        size="small"
        slotProps={{ htmlInput: { maxLength: 100 } }}
        {...register("reason")}
      />
    </FormBox>
  );
};

export default ResetInvoicePrintDialogContent;
