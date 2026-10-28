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
  reject: (error: Error) => void;
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
  const candidates = [...pendingEmits].filter(
    (pending) => pending.event === exception.cause?.pattern,
  );
  const pending =
    candidates.find((candidate) =>
      matchesPayload(candidate, exception.cause?.data),
    ) ?? candidates[0];
  const message = exception.message ?? exception.error;

  if (pending) {
    pendingEmits.delete(pending);
    pending.reject(new Error(message));
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
