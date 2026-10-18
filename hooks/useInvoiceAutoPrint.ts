"use client";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useEffect, useRef, useSyncExternalStore } from "react";

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

const DEVICE_ID_KEY = "invoicePrinterDeviceId";

let fallbackDeviceId: string | undefined;

const getDeviceId = () => {
  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) return stored;

    const deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);

    return deviceId;
  } catch {
    return (fallbackDeviceId ??= crypto.randomUUID());
  }
};

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

  const takeoverRef = useRef(false);

  const enabled = useSyncExternalStore(
    subscribe,
    () => readPrinter(organizationId),
    () => false,
  );

  useEffect(() => {
    if (!enabled || !isConnected) return;

    const handleReplaced = () => {
      writePrinter(organizationId, false);
      enqueueSnackbar(tOrders("autoPrint.replaced"), { variant: "info" });
    };

    menuSocket
      .timeout(5000)
      .emitWithAck("joinInvoicePrinter", {
        deviceId: getDeviceId(),
        organizationId,
        takeover: takeoverRef.current,
      })
      .then((isPrinter: boolean) => {
        if (isPrinter) takeoverRef.current = false;
        else handleReplaced();
      })
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
    (value: boolean) => {
      takeoverRef.current = value;
      writePrinter(organizationId, value);
    },
  ] as const;
};

export default useInvoiceAutoPrint;
