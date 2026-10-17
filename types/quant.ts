import {
  type components,
  quantCandleIntervalValues,
  quantOrderSideValues,
  quantOrderTypeValues,
} from "@/types/api";

export type QuantMarket = components["schemas"]["QuantMarketDto"];
export type QuantCandle = components["schemas"]["QuantCandleDto"];
export type QuantTrade = components["schemas"]["QuantTradeDto"];

export type QuantCredential = components["schemas"]["QuantCredentialDto"];
export type CreateQuantCredentialDto =
  components["schemas"]["CreateQuantCredentialDto"];
export type QuantBalance = components["schemas"]["QuantBalanceDto"];
export type QuantOrder = components["schemas"]["QuantOrderDto"];
export type QuantFill = components["schemas"]["QuantFillDto"];
export type PlaceQuantOrderDto = components["schemas"]["PlaceQuantOrderDto"];
export type PlaceQuantOrderResponse =
  components["schemas"]["PlaceQuantOrderResponseDto"];

export type QuantCandleInterval = (typeof quantCandleIntervalValues)[number];
export type QuantOrderSide = (typeof quantOrderSideValues)[number];
export type QuantOrderType = (typeof quantOrderTypeValues)[number];

export interface QuantDepth {
  asks: [price: number, size: number][];
  bids: [price: number, size: number][];
}

export interface QuantAccountEvent {
  credentialId: string;
  symbol?: string;
  topic: "BALANCE" | "FILL" | "ORDER";
}
