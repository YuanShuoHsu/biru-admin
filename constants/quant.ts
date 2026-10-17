import type { QuantCandleInterval, QuantMarketType } from "@/types/quant";

export const DEFAULT_QUANT_SYMBOL = "BTC_USDT";

export const DEFAULT_QUANT_SYMBOLS: Record<QuantMarketType, string> = {
  PERP: "BTC_USDT_PERP",
  SPOT: DEFAULT_QUANT_SYMBOL,
};

// Pionex 合約交易對一律以 _PERP 結尾
export const quantMarketTypeOf = (symbol: string): QuantMarketType =>
  symbol.endsWith("_PERP") ? "PERP" : "SPOT";

export const DEFAULT_QUANT_INTERVAL: QuantCandleInterval = "15M";

export const quantPairOf = (symbol: string) =>
  symbol.replace(/_PERP$/, "").replace("_", "/");
