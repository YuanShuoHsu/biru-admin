import {
  type components,
  quantBotModeValues,
  quantBotStatusValues,
  quantBotTypeValues,
  quantCandleIntervalValues,
  quantIndicatorKindValues,
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

export type QuantBot = components["schemas"]["QuantBotDto"];
export type QuantBotSummary = components["schemas"]["QuantBotSummaryDto"];
export type QuantBotOrder = components["schemas"]["QuantBotOrderDto"];
export type QuantBotFill = components["schemas"]["QuantBotFillDto"];
export type QuantBotEvent = components["schemas"]["QuantBotEventDto"];
export type CreateQuantBotResponse =
  components["schemas"]["CreateQuantBotResponseDto"];
export type GridConfig = components["schemas"]["GridConfigDto"];
export type DcaConfig = components["schemas"]["DcaConfigDto"];
export type IndicatorConfig = components["schemas"]["IndicatorConfigDto"];
export type IndicatorCondition = components["schemas"]["IndicatorConditionDto"];
export type WebhookConfig = components["schemas"]["WebhookConfigDto"];
export type CreateGridBotDto = components["schemas"]["CreateGridBotDto"];
export type CreateDcaBotDto = components["schemas"]["CreateDcaBotDto"];
export type CreateIndicatorBotDto =
  components["schemas"]["CreateIndicatorBotDto"];
export type CreateWebhookBotDto = components["schemas"]["CreateWebhookBotDto"];
export type BacktestResult = components["schemas"]["BacktestResultDto"];
export type GridBacktestDto = components["schemas"]["GridBacktestDto"];
export type DcaBacktestDto = components["schemas"]["DcaBacktestDto"];
export type IndicatorBacktestDto =
  components["schemas"]["IndicatorBacktestDto"];
export type GridAiStrategy = components["schemas"]["GridAiStrategyDto"];
export type WebhookToken = components["schemas"]["WebhookTokenDto"];

export type QuantBotType = (typeof quantBotTypeValues)[number];
export type QuantBotMode = (typeof quantBotModeValues)[number];
export type QuantBotStatus = (typeof quantBotStatusValues)[number];
export type QuantIndicatorKind = (typeof quantIndicatorKindValues)[number];
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
