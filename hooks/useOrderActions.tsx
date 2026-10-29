"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useCallback, useRef, useState } from "react";
import useSWR from "swr";

import {
  CustomizedDialogActions,
  CustomizedDialogContent,
} from "@/components/CustomizedDialogs";

import {
  PRINTER_STATUS_REFRESH_MS,
  STATUS_TEXT_COLORS,
} from "@/constants/orders";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { DialogContentText } from "@mui/material";
import { styled } from "@mui/material/styles";

import type {
  AdminOrderResponse,
  OrderInvoice,
  OrderInvoicePrint,
  OrderStatus,
  OrderTicketPrinterStatus,
  OrderTransition,
} from "@/types/orders";
import type { InvoicePrinterStatus } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { printDocument } from "@/utils/print";

import OrderDetailDialog from "@/app/[locale]/(app)/(dashboard)/orders/OrderDetailDialog";
import RefundOrderDialogContent, {
  REFUND_ORDER_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/RefundOrderDialogContent";
import ResolveInvoicePrintDialogContent, {
  RESOLVE_INVOICE_PRINT_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/ResolveInvoicePrintDialogContent";
import ResolveOrderTicketDialogContent, {
  RESOLVE_ORDER_TICKET_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/ResolveOrderTicketDialogContent";
import ReprintOrderTicketDialogContent, {
  REPRINT_ORDER_TICKET_FORM_ID,
} from "@/app/[locale]/(app)/(dashboard)/orders/ReprintOrderTicketDialogContent";
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

export const canCancelInvoicePrint = (order: AdminOrderResponse) =>
  canPrintInvoice(order) &&
  order.invoice?.printJob?.status === "queued" &&
  !!order.invoice.printJob.errorCode;

export const canResolveInvoicePrint = (order: AdminOrderResponse) =>
  canPrintInvoice(order) && order.invoice?.printJob?.status === "unknown";

const IN_FLIGHT_PRINT_JOB_STATUSES = ["queued", "sent", "unknown"] as const;

// 只有排隊中的工作會被瀏覽器接手；印表機離線時它不該擋住列印
export const printInvoiceBlockedBy = (
  { invoice }: AdminOrderResponse,
  printerOffline: boolean,
) =>
  IN_FLIGHT_PRINT_JOB_STATUSES.find(
    (status) =>
      status === invoice?.printJob?.status &&
      !(printerOffline && status === "queued"),
  ) ?? null;

export const useInvoicePrinterStatus = (organizationSlug: string) =>
  useSWR<InvoicePrinterStatus>(
    organizationSlug
      ? `/api/organizations/${organizationSlug}/invoice-printer/status`
      : null,
    { refreshInterval: PRINTER_STATUS_REFRESH_MS },
  ).data;

export const usePrintInvoiceBlocker = (organizationSlug: string) => {
  const tOrders = useTranslations("orders");

  const status = useInvoicePrinterStatus(organizationSlug);
  const printerOffline = !!status?.configured && !status.online;

  const blockedBy = useCallback(
    (order: AdminOrderResponse) => printInvoiceBlockedBy(order, printerOffline),
    [printerOffline],
  );

  const tooltip = useCallback(
    (order: AdminOrderResponse) => {
      const blocked = blockedBy(order);

      if (blocked) return tOrders(`actions.printInvoice.blocked.${blocked}`);

      return tOrders(
        order.invoice?.printedAt
          ? "actions.printInvoice.reprintTitle"
          : "actions.printInvoice.title",
      );
    },
    [blockedBy, tOrders],
  );

  return { blockedBy, tooltip };
};

export const canVoidInvoice = ({ invoice }: AdminOrderResponse) =>
  invoice?.status === "issued";

export const useOrderTicketPrinterStatuses = (organizationSlug: string) =>
  useSWR<OrderTicketPrinterStatus[]>(
    organizationSlug
      ? `/api/organizations/${organizationSlug}/order-ticket-printers/status`
      : null,
    { refreshInterval: PRINTER_STATUS_REFRESH_MS },
  ).data;

const orderTicketPrintersOf = (
  { orderTicketPrinterIds }: AdminOrderResponse,
  printers: OrderTicketPrinterStatus[] | undefined,
) => printers?.filter(({ id }) => orderTicketPrinterIds.includes(id)) ?? [];

export const canReprintOrderTicket = (
  order: AdminOrderResponse,
  printers: OrderTicketPrinterStatus[] | undefined,
) =>
  order.orderTicketReprintable &&
  !!orderTicketPrintersOf(order, printers).length;

export const findUnresolvedOrderTicket = ({
  orderTicketJobs,
}: AdminOrderResponse) =>
  orderTicketJobs.find(({ status }) => status === "unknown");

export const useOrderActions = (
  organizationSlug: string,
  mutate: () => Promise<unknown>,
) => {
  const { setDialog } = useDialogStore((state) => state);

  const [pendingInvoicePrintOrderIds, setPendingInvoicePrintOrderIds] =
    useState<ReadonlySet<string>>(new Set());

  const pendingInvoicePrintOrderIdsRef = useRef(new Set<string>());

  const withPendingInvoicePrint = useCallback(
    async (order: AdminOrderResponse, request: () => Promise<void>) => {
      const pendingIds = pendingInvoicePrintOrderIdsRef.current;
      if (pendingIds.has(order.id)) return;

      pendingIds.add(order.id);
      setPendingInvoicePrintOrderIds(new Set(pendingIds));

      try {
        await request();
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        try {
          await mutate();
        } finally {
          pendingIds.delete(order.id);
          setPendingInvoicePrintOrderIds(new Set(pendingIds));
        }
      }
    },
    [mutate],
  );

  const tOrders = useTranslations("orders");

  const handleViewOrder = useCallback(
    (order: AdminOrderResponse) => {
      setDialog({
        content: (
          <>
            <CustomizedDialogContent>
              <OrderDetailDialog
                order={order}
                organizationSlug={organizationSlug}
              />
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
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
          <>
            <CustomizedDialogContent>
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
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
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
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tOrders.rich("actions.issueInvoice.confirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  orderNumber: order.orderNumber,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
        ),
        onConfirm: () => handleIssueInvoice(order),
        open: true,
        title: tOrders("actions.issueInvoice.title"),
      });
    },
    [handleIssueInvoice, setDialog, tOrders],
  );

  const handlePrintInvoice = useCallback(
    (order: AdminOrderResponse) =>
      withPendingInvoicePrint(order, async () => {
        const invoiceUrl = `/api/organizations/${organizationSlug}/orders/${order.id}/invoice`;

        const { printHtml, printJob } = await fetcher<OrderInvoicePrint>(
          `${invoiceUrl}/print`,
          { method: "POST" },
        );

        if (!printHtml) {
          enqueueSnackbar(
            tOrders("actions.printInvoice.queued", {
              orderNumber: order.orderNumber,
            }),
            { variant: "success" },
          );

          return;
        }

        await printDocument(printHtml);
        await fetcher(`${invoiceUrl}/print-jobs/${printJob.id}/confirmation`, {
          method: "POST",
        });
      }),
    [organizationSlug, tOrders, withPendingInvoicePrint],
  );

  const handleCancelInvoicePrint = useCallback(
    (order: AdminOrderResponse) => {
      const printJob = order.invoice?.printJob;
      if (!printJob) return;

      return withPendingInvoicePrint(order, async () => {
        await fetcher(
          `/api/organizations/${organizationSlug}/orders/${order.id}/invoice/print-jobs/${printJob.id}/cancellation`,
          { method: "POST" },
        );

        enqueueSnackbar(
          tOrders("actions.cancelInvoicePrint.success", {
            orderNumber: order.orderNumber,
          }),
          { variant: "success" },
        );
      });
    },
    [organizationSlug, tOrders, withPendingInvoicePrint],
  );

  const handleConfirmPrintInvoice = useCallback(
    (order: AdminOrderResponse) => {
      if (!order.invoice?.printedAt) {
        void handlePrintInvoice(order);

        return;
      }

      setDialog({
        content: (
          <>
            <CustomizedDialogContent>
              <DialogContentText>
                {tOrders.rich("actions.printInvoice.reprintConfirm", {
                  bold: (chunks) => <strong>{chunks}</strong>,
                  orderNumber: order.orderNumber,
                })}
              </DialogContentText>
            </CustomizedDialogContent>
            <CustomizedDialogActions />
          </>
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

  const orderTicketPrinters = useOrderTicketPrinterStatuses(organizationSlug);

  const handleConfirmReprintOrderTicket = useCallback(
    (order: AdminOrderResponse) => {
      const printers = orderTicketPrintersOf(order, orderTicketPrinters);
      if (!printers.length) return;

      setDialog({
        content: (
          <ReprintOrderTicketDialogContent
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
            printers={printers}
          />
        ),
        formId: REPRINT_ORDER_TICKET_FORM_ID,
        open: true,
        title: tOrders("actions.reprintOrderTicket.title"),
      });
    },
    [mutate, orderTicketPrinters, organizationSlug, setDialog, tOrders],
  );

  const handleResolveOrderTicket = useCallback(
    (order: AdminOrderResponse) => {
      const job = findUnresolvedOrderTicket(order);
      if (!job) return;

      setDialog({
        content: (
          <ResolveOrderTicketDialogContent
            job={job}
            mutate={mutate}
            order={order}
            organizationSlug={organizationSlug}
          />
        ),
        formId: RESOLVE_ORDER_TICKET_FORM_ID,
        open: true,
        title: tOrders("actions.resolveOrderTicket.title"),
      });
    },
    [mutate, organizationSlug, setDialog, tOrders],
  );

  const handleResolveInvoicePrint = useCallback(
    (order: AdminOrderResponse) => {
      const printJob = order.invoice?.printJob;
      if (!printJob) return;

      setDialog({
        content: (
          <ResolveInvoicePrintDialogContent
            mutate={mutate}
            onBrowserReprint={() => handlePrintInvoice(order)}
            order={order}
            organizationSlug={organizationSlug}
            printJob={printJob}
          />
        ),
        formId: RESOLVE_INVOICE_PRINT_FORM_ID,
        open: true,
        title: tOrders("actions.resolveInvoicePrint.title"),
      });
    },
    [handlePrintInvoice, mutate, organizationSlug, setDialog, tOrders],
  );

  return {
    handleCancelInvoicePrint,
    handleConfirmIssueInvoice,
    handleConfirmPrintInvoice,
    handleConfirmReprintOrderTicket,
    handleConfirmResetInvoicePrint,
    handleConfirmStatusAction,
    handleConfirmVoidInvoice,
    handleRefund,
    handleResolveInvoicePrint,
    handleResolveOrderTicket,
    handleUpdateCustomer,
    handleViewOrder,
    pendingInvoicePrintOrderIds,
  };
};
