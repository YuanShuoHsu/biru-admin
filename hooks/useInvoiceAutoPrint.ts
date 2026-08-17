"use client";

import { useEffect } from "react";

import { menuSocket } from "@/app/socket";

interface InvoicePrintReadyPayload {
  invoiceNumber: string;
  orderId: string;
  printUrl: string;
}

/**
 * 開票完成後在櫃檯自動印出證明聯。
 *
 * 瀏覽器不會靜默列印，一般模式仍會跳出列印對話框；
 * 要免點擊直接出紙，櫃檯那台 Chrome 需以 --kiosk-printing 啟動。
 */
const useInvoiceAutoPrint = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const print = ({ printUrl }: InvoicePrintReadyPayload) => {
      const frame = document.createElement("iframe");
      frame.style.display = "none";
      frame.src = printUrl;
      frame.onload = () => frame.contentWindow?.print();
      document.body.appendChild(frame);

      // 綠界列印頁的網址 1 小時後失效，留著也沒用；給列印對話框足夠時間再移除
      window.setTimeout(() => frame.remove(), 60_000);
    };

    menuSocket.on("invoicePrintReady", print);

    return () => {
      menuSocket.off("invoicePrintReady", print);
    };
  }, [enabled]);
};

export default useInvoiceAutoPrint;
