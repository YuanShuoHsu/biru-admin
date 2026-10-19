import {
  type components,
  quantBotModeValues,
  quantBotStatusValues,
  quantBotTypeValues,
  quantCandleIntervalValues,
  quantFuturesGridStopTypeValues,
  quantGridStopTypeValues,
  quantFuturesOrderTypeValues,
  quantIndicatorKindValues,
  quantMarketTypeValues,
  quantOrderSideValues,
  quantMarginModeValues,
  quantOrderTypeValues,
  quantPositionModeValues,
  quantPositionSideValues,
} from "@/types/api";

export type QuantMarket = components["schemas"]["QuantMarketDto"];
export type QuantCandle = components["schemas"]["QuantCandleDto"];
export type QuantTrade = components["schemas"]["QuantTradeDto"];
export type QuantPerpInfo = components["schemas"]["QuantPerpInfoDto"];
export type QuantRiskTier = components["schemas"]["QuantRiskTierDto"];
export type QuantFundingRate = components["schemas"]["QuantFundingRateDto"];

export type QuantCredential = components["schemas"]["QuantCredentialDto"];
export type CreateQuantCredentialDto =
  components["schemas"]["CreateQuantCredentialDto"];
export type QuantBalance = components["schemas"]["QuantBalanceDto"];
export type QuantOrder = components["schemas"]["QuantOrderDto"];
export type QuantFill = components["schemas"]["QuantFillDto"];
export type PlaceQuantOrderDto = components["schemas"]["PlaceQuantOrderDto"];
export type PlaceQuantOrderResponse =
  components["schemas"]["PlaceQuantOrderResponseDto"];

export type QuantFuturesAccount =
  components["schemas"]["QuantFuturesAccountDto"];
export type QuantFuturesBalance =
  components["schemas"]["QuantFuturesBalanceDto"];
export type QuantFuturesSymbolSettings =
  components["schemas"]["QuantFuturesSymbolSettingsDto"];
export type QuantPosition = components["schemas"]["QuantPositionDto"];
export type QuantPositionHistory =
  components["schemas"]["QuantPositionHistoryDto"];
export type QuantFuturesOrder = components["schemas"]["QuantFuturesOrderDto"];
export type QuantFuturesFill = components["schemas"]["QuantFuturesFillDto"];
export type QuantFundingFee = components["schemas"]["QuantFundingFeeDto"];
export type QuantFuturesOrderPreview =
  components["schemas"]["QuantFuturesOrderPreviewDto"];
export type PreviewFuturesOrderDto =
  components["schemas"]["PreviewFuturesOrderDto"];
export type PlaceFuturesOrderDto =
  components["schemas"]["PlaceFuturesOrderDto"];
export type AdjustIsolatedMarginDto =
  components["schemas"]["AdjustIsolatedMarginDto"];
export type SetLeverageDto = components["schemas"]["SetLeverageDto"];
export type SetMarginModeDto = components["schemas"]["SetMarginModeDto"];
export type SetPositionModeDto = components["schemas"]["SetPositionModeDto"];

export type QuantBot = components["schemas"]["QuantBotDto"];
export type QuantBotSummary = components["schemas"]["QuantBotSummaryDto"];
export type QuantBotOrder = components["schemas"]["QuantBotOrderDto"];
export type QuantBotFill = components["schemas"]["QuantBotFillDto"];
export type QuantBotEvent = components["schemas"]["QuantBotEventDto"];
export type CreateQuantBotResponse =
  components["schemas"]["CreateQuantBotResponseDto"];
export type GridConfig = components["schemas"]["GridConfigDto"];
export type FuturesGridConfig = components["schemas"]["FuturesGridConfigDto"];
export type FuturesGridOperationDto =
  components["schemas"]["FuturesGridOperationDto"];
export type FuturesGridOperationCheck =
  components["schemas"]["FuturesGridOperationCheckDto"];
export type AiConfig = components["schemas"]["AiConfigDto"];
export type QuantAiKey = components["schemas"]["QuantAiKeyDto"];
export type SetQuantAiKeyDto = components["schemas"]["SetQuantAiKeyDto"];
export type SignalBotConfig = components["schemas"]["SignalBotConfigDto"];
export type FuturesPositionConfig =
  components["schemas"]["FuturesPositionConfigDto"];
export type SignalSetup = components["schemas"]["SignalSetupDto"];
export type SendSignalDto = components["schemas"]["SendSignalDto"];
export type FuturesGridCheckDto = components["schemas"]["FuturesGridCheckDto"];
export type FuturesGridCheckResult =
  components["schemas"]["FuturesGridCheckResultDto"];
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
export type GridCheckDto = components["schemas"]["GridCheckDto"];
export type GridCheckResult = components["schemas"]["GridCheckResultDto"];
export type GridOperationDto = components["schemas"]["GridOperationDto"];
export type QuantBotFillMarker = components["schemas"]["QuantBotFillMarkerDto"];
export type QuantBotEquityPoint =
  components["schemas"]["QuantBotEquityPointDto"];
export type QuantBotFilterField = components["schemas"]["QuantBotFilterField"];
export type QuantBotSortField = components["schemas"]["QuantBotSortField"];
export type QuantBotOrderSortField =
  components["schemas"]["QuantBotOrderSortField"];
export type QuantBotFillSortField =
  components["schemas"]["QuantBotFillSortField"];
export type QuantBotEventSortField =
  components["schemas"]["QuantBotEventSortField"];
export type WebhookToken = components["schemas"]["WebhookTokenDto"];

export type QuantBotType = (typeof quantBotTypeValues)[number];
export type QuantBotMode = (typeof quantBotModeValues)[number];
export type QuantBotStatus = (typeof quantBotStatusValues)[number];
export type QuantIndicatorKind = (typeof quantIndicatorKindValues)[number];
export type GridStopType = (typeof quantGridStopTypeValues)[number];
export type FuturesGridStopType =
  (typeof quantFuturesGridStopTypeValues)[number];
export type QuantMarketType = (typeof quantMarketTypeValues)[number];
export type QuantCandleInterval = (typeof quantCandleIntervalValues)[number];
export type QuantOrderSide = (typeof quantOrderSideValues)[number];
export type QuantOrderType = (typeof quantOrderTypeValues)[number];
export type QuantFuturesOrderType =
  (typeof quantFuturesOrderTypeValues)[number];
export type QuantMarginMode = (typeof quantMarginModeValues)[number];
export type QuantPositionMode = (typeof quantPositionModeValues)[number];
export type QuantPositionSide = (typeof quantPositionSideValues)[number];

export interface QuantDepth {
  asks: [price: number, size: number][];
  bids: [price: number, size: number][];
}

export type QuantPerpIndex = Pick<
  QuantPerpInfo,
  "indexPrice" | "markPrice" | "nextFundingRate" | "nextFundingTime"
>;

export interface QuantAccountEvent {
  credentialId: string;
  market: QuantMarketType;
  symbol?: string;
  topic: "BALANCE" | "FILL" | "ORDER" | "POSITION" | "RISK";
}
