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

/**
 * 開票完成後在櫃檯自動印出證明聯。
 *
 * 瀏覽器不會靜默列印，一般模式仍會跳出列印對話框；
 * 要免點擊直接出紙，櫃檯那台 Chrome 需以 --kiosk-printing 啟動。
 */
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
        // 自動列印沒出紙，櫃檯要知道才會改用手動列印
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
