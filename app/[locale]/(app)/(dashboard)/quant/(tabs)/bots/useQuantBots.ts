"use client";

import { useEffect, useMemo } from "react";

import { useMessages, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { useSocketConnection } from "@/hooks/useSocketConnection";

import { quantSocket } from "@/app/socket";

import type { QuantBot } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";

export const QUANT_BOTS_URL = "/api/quant/bots";

const REVALIDATE_DELAY_MS = 500;

export const isQuantBotKey = (key: unknown) => {
  const url = Array.isArray(key) ? key[0] : key;

  return typeof url === "string" && url.startsWith(QUANT_BOTS_URL);
};

// 成交推播可能一秒好幾筆，合併成一次重新抓取
export const useBotStream = () => {
  const { mutate } = useSWRConfig();
  const { isConnected } = useSocketConnection(quantSocket);

  useEffect(() => {
    if (!isConnected) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const revalidate = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        void mutate(isQuantBotKey);
      }, REVALIDATE_DELAY_MS);
    };

    quantSocket
      .timeout(10000)
      .emitWithAck("watchBots")
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );
    quantSocket.on("bot", revalidate);

    return () => {
      quantSocket.off("bot", revalidate);
      if (timer) clearTimeout(timer);
    };
  }, [isConnected, mutate]);
};

/** 代碼有翻譯就顯示翻譯，未知的（例如 Pionex 新增的停止原因）原樣顯示 */
export const useBotLabels = () => {
  const tBots = useTranslations("quant.bots");
  const { events, pauses, reasons, skipReasons } = useMessages().quant.bots;

  return useMemo(
    () => ({
      // 新建立的機器人資料庫狀態是 stopped，但對使用者來說是「還沒啟動」
      status: ({ startedAt, status }: Pick<QuantBot, "startedAt" | "status">) =>
        tBots(startedAt ? `statuses.${status}` : "statuses.notStarted"),
      event: (kind: string) =>
        kind in events ? tBots(`events.${kind as keyof typeof events}`) : kind,
      reason: (reason?: string) =>
        reason && reason in reasons
          ? tBots(`reasons.${reason as keyof typeof reasons}`)
          : reason,
      /** 執行中但暫停開新倉的原因；不是暫停原因時回傳 undefined */
      pause: (reason?: string) =>
        reason && reason in pauses
          ? tBots(`pauses.${reason as keyof typeof pauses}`)
          : undefined,
      skipReason: (reason: string) =>
        reason in skipReasons
          ? tBots(`skipReasons.${reason as keyof typeof skipReasons}`)
          : reason,
    }),
    [events, pauses, reasons, skipReasons, tBots],
  );
};

// 依顯示的兩位小數判斷，避免 0.00 因為極小的正負值被染色
export const pnlColor = (value: number) => {
  const shown = Math.round(value * 100);

  return shown > 0 ? "success.main" : shown < 0 ? "error.main" : "text.primary";
};
