"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useSyncExternalStore } from "react";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { menuSocket } from "@/app/socket";

import type { OrderInvoicePrint } from "@/types/orders";
import type { Organization } from "@/types/organizations";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";
import { printDocument } from "@/utils/print";

interface InvoicePrintReadyPayload {
  invoiceNumber: string;
  orderId: string;
}

const listeners = new Set<() => void>();

const storageKey = (organizationId: string) =>
  `invoicePrinter:${organizationId}`;

const readPrinter = (organizationId: string) => {
  try {
    return localStorage.getItem(storageKey(organizationId)) === "1";
  } catch {
    return false;
  }
};

const writePrinter = (organizationId: string, enabled: boolean) => {
  try {
    if (enabled) localStorage.setItem(storageKey(organizationId), "1");
    else localStorage.removeItem(storageKey(organizationId));
  } catch {}

  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const useInvoiceAutoPrint = ({
  id: organizationId,
  slug: organizationSlug,
}: Pick<Organization, "id" | "slug">) => {
  const tOrders = useTranslations("orders");

  const { isConnected } = useSocketConnection(menuSocket);

  const enabled = useSyncExternalStore(
    subscribe,
    () => readPrinter(organizationId),
    () => false,
  );

  useEffect(() => {
    if (!enabled || !isConnected) return;

    menuSocket
      .timeout(5000)
      .emitWithAck("joinInvoicePrinter", { organizationId })
      .catch((error) => {
        writePrinter(organizationId, false);
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      });

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

    const handleReplaced = () => {
      writePrinter(organizationId, false);
      enqueueSnackbar(tOrders("autoPrint.replaced"), { variant: "info" });
    };

    menuSocket.on("invoicePrintReady", print);
    menuSocket.on("invoicePrinterReplaced", handleReplaced);

    return () => {
      menuSocket.off("invoicePrintReady", print);
      menuSocket.off("invoicePrinterReplaced", handleReplaced);
      menuSocket.volatile.emit("leaveInvoicePrinter", { organizationId });
    };
  }, [enabled, isConnected, organizationId, organizationSlug, tOrders]);

  return [
    enabled,
    (value: boolean) => writePrinter(organizationId, value),
  ] as const;
};

export default useInvoiceAutoPrint;
