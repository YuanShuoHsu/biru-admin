"use client";

import { useEffect } from "react";

import { enqueueSnackbar } from "notistack";
import { useSWRConfig } from "swr";

import { isQuantAccountKey } from "../../useQuantCredentials";

import { quantSocket } from "@/app/socket";

import type { QuantAccountEvent } from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";

// 推播只代表帳戶有變動，資料一律重新向 API 取，重連漏掉的事件也不會不一致
export const useAccountStream = (
  credentialId: string | undefined,
  symbol: string,
  isConnected: boolean,
) => {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!isConnected || !credentialId) return;

    const revalidate = () => mutate(isQuantAccountKey(credentialId));

    quantSocket
      .timeout(10000)
      .emitWithAck("watchAccount", { credentialId, symbol })
      .then(revalidate)
      .catch((error) =>
        enqueueSnackbar(getErrorMessage(error), { variant: "error" }),
      );

    const onAccount = (event: QuantAccountEvent) => {
      if (event.credentialId === credentialId) void revalidate();
    };

    quantSocket.on("account", onAccount);

    return () => {
      quantSocket.off("account", onAccount);
      quantSocket.emit("unwatchAccount");
    };
  }, [credentialId, isConnected, mutate, symbol]);
};
