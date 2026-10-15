"use client";

import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";

import { menuSocket } from "@/app/socket";

import type { OrderInvoicePrint } from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { printDocument } from "@/utils/print";

interface InvoicePrintReadyPayload {
  invoiceNumber: string;
  orderId: string;
}

const useInvoiceAutoPrint = (enabled: boolean, organizationSlug: string) => {
  useEffect(() => {
    if (!enabled) return;

    const print = async ({ orderId }: InvoicePrintReadyPayload) => {
      try {
        const { printHtml } = await fetcher<OrderInvoicePrint>(
          `/api/organizations/${organizationSlug}/orders/${orderId}/invoice/print`,
          { method: "POST" },
        );

        printDocument(printHtml);
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      }
    };

    menuSocket.on("invoicePrintReady", print);

    return () => {
      menuSocket.off("invoicePrintReady", print);
    };
  }, [enabled, organizationSlug]);
};

export default useInvoiceAutoPrint;
