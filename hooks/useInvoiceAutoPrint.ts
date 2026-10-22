"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useSyncExternalStore } from "react";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import type { OrderInvoicePrint, UnprintedInvoice } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { printDocument } from "@/utils/print";

interface InvoicePrintReadyPayload {
  invoiceNumber: string;
  orderId: string;
  organizationId: string;
}

interface InvoicePrinterReplacedPayload {
  organizationId: string;
}

const listeners = new Set<() => void>();

const pendingTakeovers = new Set<string>();

const interruptedPrinters = new Set<string>();

// 即時通知與補印可能同時送來同一張；同一分頁重複領取會撞上自己的領取，或在確認後印成補印聯
const printingOrderIds = new Set<string>();

// 同時呼叫多次 print() 會疊出多個列印對話框，有的會被吃掉
let printQueue = Promise.resolve();

const JOIN_TIMEOUT_MS = 5000;

// 分頁各自一個 id：共用時同裝置第二個分頁加入會把第一個無聲踢出列印房
const SESSION_ID_KEY = "invoicePrinterSessionId";

let fallbackSessionId: string | undefined;

const removeLegacyDevicePrinterKeys = () => {
  try {
    localStorage.removeItem("invoicePrinterDeviceId");
    Object.keys(localStorage)
      .filter((key) => key.startsWith("invoicePrinter:"))
      .forEach((key) => localStorage.removeItem(key));
  } catch {}
};

const getSessionId = () => {
  try {
    const stored = sessionStorage.getItem(SESSION_ID_KEY);
    if (stored) return stored;

    removeLegacyDevicePrinterKeys();

    const sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);

    return sessionId;
  } catch {
    return (fallbackSessionId ??= crypto.randomUUID());
  }
};

const storageKey = (organizationId: string) =>
  `invoicePrinter:${organizationId}`;

const readPrinter = (organizationId: string) => {
  try {
    return sessionStorage.getItem(storageKey(organizationId)) === "1";
  } catch {
    return false;
  }
};

const writePrinter = (organizationId: string, enabled: boolean) => {
  try {
    if (enabled) sessionStorage.setItem(storageKey(organizationId), "1");
    else sessionStorage.removeItem(storageKey(organizationId));
  } catch {}

  if (!enabled) interruptedPrinters.delete(organizationId);

  listeners.forEach((listener) => listener());
};

const setInterrupted = (organizationId: string, interrupted: boolean) => {
  if (interruptedPrinters.has(organizationId) === interrupted) return;

  if (interrupted) interruptedPrinters.add(organizationId);
  else interruptedPrinters.delete(organizationId);

  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const useInvoicePrinterEnabled = (organizationId: string) =>
  useSyncExternalStore(
    subscribe,
    () => readPrinter(organizationId),
    () => false,
  );

const useInvoicePrinterInterrupted = (organizationId: string) =>
  useSyncExternalStore(
    subscribe,
    () => interruptedPrinters.has(organizationId),
    () => false,
  );

export const useInvoiceAutoPrinter = ({
  id: organizationId,
  slug: organizationSlug,
}: Pick<Organization, "id" | "slug">) => {
  const tOrders = useTranslations("orders");

  const { isConnected } = useSocketConnection(menuSocket);

  const enabled = useInvoicePrinterEnabled(organizationId);

  useEffect(() => {
    if (!enabled) return;

    if (!isConnected) {
      const timer = window.setTimeout(
        () => setInterrupted(organizationId, true),
        JOIN_TIMEOUT_MS,
      );

      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    let retryTimer: number | undefined;

    const handleReplaced = () => {
      writePrinter(organizationId, false);
      enqueueSnackbar(tOrders("autoPrint.replaced"), { variant: "info" });
    };

    const printInvoice = async (orderId: string) => {
      if (cancelled) {
        printingOrderIds.delete(orderId);

        return;
      }

      const invoiceUrl = `/api/organizations/${organizationSlug}/orders/${orderId}/invoice`;

      try {
        const { printHtml } = await fetcher<OrderInvoicePrint>(
          `${invoiceUrl}/print`,
          { method: "POST" },
        );

        await printDocument(printHtml);
      } catch (error) {
        printingOrderIds.delete(orderId);
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });

        return;
      }

      // 已經印出來了，確認失敗也不能讓這張回到待印，否則會再印一次正本
      await fetcher(`${invoiceUrl}/print/confirmation`, {
        method: "POST",
      }).catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );
    };

    const print = (orderId: string) => {
      if (printingOrderIds.has(orderId)) return;

      printingOrderIds.add(orderId);
      printQueue = printQueue.then(() => printInvoice(orderId));
    };

    const printMissed = async () => {
      try {
        const invoices = await fetcher<UnprintedInvoice[]>(
          `/api/organizations/${organizationSlug}/invoices/unprinted`,
        );

        if (!cancelled) invoices.forEach(({ orderId }) => print(orderId));
      } catch (error) {
        if (!cancelled)
          enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      }
    };

    const join = () => {
      menuSocket
        .timeout(JOIN_TIMEOUT_MS)
        .emitWithAck("joinInvoicePrinter", {
          deviceId: getSessionId(),
          organizationId,
          takeover: pendingTakeovers.has(organizationId),
        })
        .then((isPrinter: boolean) => {
          if (cancelled) return;

          if (!isPrinter) return handleReplaced();

          pendingTakeovers.delete(organizationId);
          setInterrupted(organizationId, false);
          void printMissed();
        })
        .catch(() => {
          if (cancelled) return;

          setInterrupted(organizationId, true);
          retryTimer = window.setTimeout(join, JOIN_TIMEOUT_MS);
        });
    };

    join();

    const handlePrintReady = (payload: InvoicePrintReadyPayload) => {
      if (payload.organizationId === organizationId) print(payload.orderId);
    };

    const handleReplacedEvent = (payload: InvoicePrinterReplacedPayload) => {
      if (payload.organizationId === organizationId) handleReplaced();
    };

    menuSocket.on("invoicePrintReady", handlePrintReady);
    menuSocket.on("invoicePrinterReplaced", handleReplacedEvent);

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      menuSocket.off("invoicePrintReady", handlePrintReady);
      menuSocket.off("invoicePrinterReplaced", handleReplacedEvent);
      menuSocket.volatile.emit("leaveInvoicePrinter", { organizationId });
    };
  }, [enabled, isConnected, organizationId, organizationSlug, tOrders]);
};

const useInvoiceAutoPrint = (organizationId: string) =>
  [
    useInvoicePrinterEnabled(organizationId),
    (value: boolean) => {
      if (value) pendingTakeovers.add(organizationId);
      else pendingTakeovers.delete(organizationId);

      writePrinter(organizationId, value);
    },
    useInvoicePrinterInterrupted(organizationId),
  ] as const;

export default useInvoiceAutoPrint;
