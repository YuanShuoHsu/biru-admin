import { type components, quantCandleIntervalValues } from "@/types/api";

export type QuantMarket = components["schemas"]["QuantMarketDto"];
export type QuantCandle = components["schemas"]["QuantCandleDto"];
export type QuantTrade = components["schemas"]["QuantTradeDto"];

export type QuantCandleInterval = (typeof quantCandleIntervalValues)[number];

export interface QuantDepth {
  asks: [price: number, size: number][];
  bids: [price: number, size: number][];
}
