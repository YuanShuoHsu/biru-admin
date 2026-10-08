"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback } from "react";

import { STATUS_TEXT_COLORS } from "@/constants/orders";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { DialogContentText } from "@mui/material";
import { styled } from "@mui/material/styles";

import type {
  AdminOrderResponse,
  OrderInvoice,
  OrderInvoicePrint,
  OrderStatus,
  OrderTransition,
} from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { printDocument } from "@/utils/print";

import OrderDetailDialog from "@/app/[locale]/(app)/(dashboard)/orders/OrderDetailDialog";
import RefundOrderDialogContent, {
  REFUND_ORDER_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/RefundOrderDialogContent";
import ResetInvoicePrintDialogContent, {
  RESET_INVOICE_PRINT_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/ResetInvoicePrintDialogContent";
import UpdateOrderCustomerDialogContent, {
  UPDATE_ORDER_CUSTOMER_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/UpdateOrderCustomerDialogContent";
import VoidInvoiceDialogContent, {
  VOID_INVOICE_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/VoidInvoiceDialogContent";

const StatusText = styled("span", {
  shouldForwardProp: (prop) => prop !== "as" && prop !== "status",
})<{ status: OrderStatus }>(({ status, theme }) => {
  const key = STATUS_TEXT_COLORS[status];

  return {
    color:
      key === "text"
        ? theme.vars.palette.text.primary
        : theme.vars.palette[key].main,
  };
});

export const canIssueInvoice = ({ invoice, paymentDate }: AdminOrderResponse) =>
  !!paymentDate && invoice?.status === "pending";

export const canPrintInvoice = ({ invoice }: AdminOrderResponse) =>
  invoice?.status === "issued" &&
  !invoice.carrierType &&
  invoice.type !== "donate";

export const canResetInvoicePrint = (order: AdminOrderResponse) =>
  canPrintInvoice(order) && !!order.invoice?.printedAt;

export const canVoidInvoice = ({ invoice }: AdminOrderResponse) =>
  invoice?.status === "issued";

export const useOrderActions = (
  organizationSlug: string,
  mutate: () => void,
) => {
  const { setDialog } = useDialogStore((state) => state);

  const tOrders = useTranslations("orders");

  const handleViewOrder = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <OrderDetailDialog
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        open: true,
        title: tOrders("actions.viewOrder.title"),
      });
    },
    [organizationSlug, setDialog, tOrders],
  );

  const handleUpdateCustomer = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <UpdateOrderCustomerDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: UPDATE_ORDER_CUSTOMER_FORM_ID,
        open: true,
        title: tOrders("actions.updateCustomer.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  const handleStatusAction = useCallback(
    async (order: AdminOrderResponse, toStatus: OrderStatus) => {
      try {
        await fetcher(
          `/api/organizations/${organizationSlug}/orders/transitions/${toStatus}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderIds: [order.id] }),
          },
        );

        enqueueSnackbar(
          tOrders("actions.updateStatus.success", {
            count: 1,
            orderNumbers: order.orderNumber,
            status: tOrders(`status.${toStatus}`),
          }),
          { variant: "success" },
        );
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
      }
    },
    [mutate, organizationSlug, tOrders],
  );

  const handleConfirmStatusAction = useCallback(
    (order: AdminOrderResponse, { direction, toStatus }: OrderTransition) => {
      const status = tOrders(`status.${toStatus}`);

      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich(
              direction === "cancel"
                ? "actions.updateStatus.confirm.cancel"
                : "actions.updateStatus.confirm.default",
              {
                bold: (chunks) => <strong>{chunks}</strong>,
                count: 1,
                orderNumbers: order.orderNumber,
                status,
                statusText: (chunks) => (
                  <StatusText as="strong" status={toStatus}>
                    {chunks}
                  </StatusText>
                ),
              },
            )}
          </DialogContentText>
        ),
        onConfirm: () => handleStatusAction(order, toStatus),
        open: true,
        title: tOrders.rich(`actions.updateStatus.title.${direction}`, {
          status,
          statusText: (chunks) => (
            <StatusText status={toStatus}>{chunks}</StatusText>
          ),
        }),
      });
    },
    [handleStatusAction, setDialog, tOrders],
  );

  const handleRefund = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <RefundOrderDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: REFUND_ORDER_FORM_ID,
        open: true,
        title: tOrders("actions.refund.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  const handleIssueInvoice = useCallback(
    async (order: AdminOrderResponse) => {
      try {
        const issued = await fetcher<OrderInvoice>(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice`,
          { method: "POST" },
        );

        enqueueSnackbar(
          tOrders("actions.issueInvoice.success", {
            invoiceNumber: issued.invoiceNumber || "",
            orderNumber: order.orderNumber,
          }),
          { variant: "success" },
        );
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
      }
    },
    [mutate, organizationSlug, tOrders],
  );

  const handleConfirmIssueInvoice = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich("actions.issueInvoice.confirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              orderNumber: order.orderNumber,
            })}
          </DialogContentText>
        ),
        onConfirm: () => handleIssueInvoice(order),
        open: true,
        title: tOrders("actions.issueInvoice.title"),
      });
    },
    [handleIssueInvoice, setDialog, tOrders],
  );

  const handlePrintInvoice = useCallback(
    async (order: AdminOrderResponse) => {
      try {
        const { printHtml } = await fetcher<OrderInvoicePrint>(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print`,
          { method: "POST" },
        );

        printDocument(printHtml);
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        mutate();
      }
    },
    [mutate, organizationSlug],
  );

  const handleConfirmPrintInvoice = useCallback(
    (order: AdminOrderResponse) => {
      if (!order.invoice?.printedAt) {
        void handlePrintInvoice(order);

        return;
      }

      setDialog({
        content: (
          <DialogContentText>
            {tOrders.rich("actions.printInvoice.reprintConfirm", {
              bold: (chunks) => <strong>{chunks}</strong>,
              orderNumber: order.orderNumber,
            })}
          </DialogContentText>
        ),
        onConfirm: () => handlePrintInvoice(order),
        open: true,
        title: tOrders("actions.printInvoice.reprintTitle"),
      });
    },
    [handlePrintInvoice, setDialog, tOrders],
  );

  const handleConfirmVoidInvoice = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <VoidInvoiceDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: VOID_INVOICE_FORM_ID,
        open: true,
        title: tOrders("actions.voidInvoice.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  const handleConfirmResetInvoicePrint = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <ResetInvoicePrintDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: RESET_INVOICE_PRINT_FORM_ID,
        open: true,
        title: tOrders("actions.resetInvoicePrint.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  return {
    handleConfirmIssueInvoice,
    handleConfirmPrintInvoice,
    handleConfirmResetInvoicePrint,
    handleConfirmStatusAction,
    handleConfirmVoidInvoice,
    handleRefund,
    handleUpdateCustomer,
    handleViewOrder,
  };
};
