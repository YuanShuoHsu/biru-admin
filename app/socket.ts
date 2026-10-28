// https://socket.io/how-to/use-with-nextjs

"use client";

import { enqueueSnackbar } from "notistack";
import { Manager } from "socket.io-client";

import type { SocketException } from "@/types/socket";

const url = process.env.NEXT_PUBLIC_NEST_URL;

const manager = new Manager(url, { withCredentials: true });

// export const socket = manager.socket("/");

export const menuSocket = manager.socket("/menus");

export const quantSocket = manager.socket("/quant");

interface PendingEmit {
  event: string;
  payload: Record<string, unknown>;
  reject: (reason: unknown) => void;
}

const pendingEmits = new Set<PendingEmit>();

const matchesPayload = (pending: PendingEmit, data: unknown) =>
  typeof data === "object" &&
  data !== null &&
  Object.entries(pending.payload).every(
    ([key, value]) =>
      key === "accessToken" || (data as Record<string, unknown>)[key] === value,
  );

menuSocket.on("exception", (exception: SocketException) => {
  const pending = [...pendingEmits].find(
    (candidate) =>
      candidate.event === exception.cause?.pattern &&
      matchesPayload(candidate, exception.cause.data),
  );
  const message = exception.message ?? exception.error;

  if (pending) {
    pendingEmits.delete(pending);
    pending.reject(message ? new Error(message) : exception);
  } else if (message) {
    enqueueSnackbar(message, { variant: "error" });
  }
});

export const emitMenuWithAck = <T>(
  event: string,
  payload: Record<string, unknown>,
) =>
  new Promise<T>((resolve, reject) => {
    const pending: PendingEmit = { event, payload, reject };

    pendingEmits.add(pending);

    menuSocket
      .timeout(5000)
      .emitWithAck(event, payload)
      .then(resolve, reject)
      .finally(() => pendingEmits.delete(pending));
  });
