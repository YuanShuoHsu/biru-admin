// https://socket.io/how-to/use-with-nextjs

"use client";

import { Manager } from "socket.io-client";

const url = process.env.NEXT_PUBLIC_NEST_URL;

const manager = new Manager(url, {
  transports: ["websocket"],
});

// export const socket = manager.socket("/");

export const menuSocket = manager.socket("/menus");
