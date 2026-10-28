// https://socket.io/how-to/use-with-nextjs

"use client";

import { useEffect, useState } from "react";
import { type Socket } from "socket.io-client";

export const useSocketConnection = (socket: Socket) => {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  useEffect(() => {
    let engine: typeof socket.io.engine | undefined;

    const onUpgrade = (transport: { name: string }) => {
      setTransport(transport.name);
    };

    const detachUpgrade = () => {
      engine?.off("upgrade", onUpgrade);
      engine = undefined;
    };

    const onConnect = () => {
      engine = socket.io.engine;
      setIsConnected(true);
      setTransport(engine.transport.name);
      engine.on("upgrade", onUpgrade);
    };

    const onDisconnect = () => {
      detachUpgrade();
      setIsConnected(false);
      setTransport("N/A");
    };

    if (socket.connected) onConnect();
    else onDisconnect();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      detachUpgrade();
    };
  }, [socket]);

  return { isConnected, transport };
};
