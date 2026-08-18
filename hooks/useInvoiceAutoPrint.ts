"use client";

import { enqueueSnackbar } from "notistack";
import { useEffect } from "react";

import { menuSocket } from "@/app/socket";

import type { OrderInvoicePrint } from "@/types/orders";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

interface InvoicePrintReadyPayload {
  invoiceNumber: string;
  orderId: string;
}

const useInvoiceAutoPrint = (enabled: boolean, organizationSlug: string) => {
  useEffect(() => {
    if (!enabled) return;

    const print = async ({ orderId }: InvoicePrintReadyPayload) => {
      let printHtml: string;
      try {
        ({ printHtml } = await fetcher<OrderInvoicePrint>(
          `/api/organizations/${organizationSlug}/orders/${orderId}/invoice/print`,
          { method: "POST" },
        ));
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });

        return;
      }

      const frame = document.createElement("iframe");

      // display: none 的 iframe 不會排版，印出來是空白；只能移到畫面外
      frame.style.border = "0";
      frame.style.bottom = "0";
      frame.style.height = "0";
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.width = "0";

      frame.onload = () => frame.contentWindow?.print();
      frame.srcdoc = printHtml;
      document.body.appendChild(frame);

      window.setTimeout(() => frame.remove(), 60_000);
    };

    menuSocket.on("invoicePrintReady", print);

    return () => {
      menuSocket.off("invoicePrintReady", print);
    };
  }, [enabled, organizationSlug]);
};

export default useInvoiceAutoPrint;
