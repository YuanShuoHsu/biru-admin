"use client";

import { useEffect, useRef } from "react";

import { enqueueSnackbar } from "notistack";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { quantSocket } from "@/app/socket";

import type {
  QuantCandle,
  QuantCandleInterval,
  QuantDepth,
  QuantPerpIndex,
  QuantTrade,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";

interface StreamKey {
  interval: QuantCandleInterval;
  symbol: string;
}

interface MarketStreamHandlers {
  onCandle?: (candle: QuantCandle) => void;
  onDepth?: (depth: QuantDepth) => void;
  onPerpIndex?: (index: QuantPerpIndex) => void;
  onTrades?: (trades: QuantTrade[]) => void;
}

export const useMarketStream = (
  symbol: string,
  interval: QuantCandleInterval,
  handlers: MarketStreamHandlers,
) => {
  const { isConnected } = useSocketConnection(quantSocket);

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!isConnected) return;

    quantSocket
      .timeout(10000)
      .emitWithAck("watchMarket", { interval, symbol })
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    // 切換交易對時，舊交易對的推播可能晚到
    const onCandle = (event: { candle: QuantCandle } & StreamKey) => {
      if (event.symbol === symbol && event.interval === interval)
        handlersRef.current.onCandle?.(event.candle);
    };
    const onDepth = (event: QuantDepth & Pick<StreamKey, "symbol">) => {
      if (event.symbol === symbol) handlersRef.current.onDepth?.(event);
    };
    const onPerpIndex = (event: QuantPerpIndex & Pick<StreamKey, "symbol">) => {
      if (event.symbol === symbol) handlersRef.current.onPerpIndex?.(event);
    };
    const onTrades = (
      event: { trades: QuantTrade[] } & Pick<StreamKey, "symbol">,
    ) => {
      if (event.symbol === symbol) handlersRef.current.onTrades?.(event.trades);
    };

    quantSocket.on("candle", onCandle);
    quantSocket.on("depth", onDepth);
    quantSocket.on("perpIndex", onPerpIndex);
    quantSocket.on("trades", onTrades);

    return () => {
      quantSocket.off("candle", onCandle);
      quantSocket.off("depth", onDepth);
      quantSocket.off("perpIndex", onPerpIndex);
      quantSocket.off("trades", onTrades);
      quantSocket.emit("unwatchMarket");
    };
  }, [interval, isConnected, symbol]);

  return { isConnected };
};
