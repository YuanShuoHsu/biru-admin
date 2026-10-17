import { BollingerBands, EMA, MACD, RSI, SMA } from "technicalindicators";

import type { QuantCandle } from "@/types/quant";

export const OVERLAY_INDICATORS = ["ma", "ema", "bollingerBands"] as const;
export const PANE_INDICATORS = ["rsi", "macd"] as const;

export type OverlayIndicator = (typeof OVERLAY_INDICATORS)[number];
export type PaneIndicator = (typeof PANE_INDICATORS)[number];
export type Indicator = OverlayIndicator | PaneIndicator;

export interface IndicatorPoint {
  time: number;
  value: number;
}

export interface IndicatorLine {
  key: string;
  points: IndicatorPoint[];
}

const MA_PERIODS = [7, 25, 99];
const EMA_PERIODS = [12, 26];
const BOLLINGER = { period: 20, stdDev: 2 };
const RSI_PERIOD = 14;
const MACD_PERIODS = { fastPeriod: 12, signalPeriod: 9, slowPeriod: 26 };

// technicalindicators 的輸出會少掉前面暖機的筆數，要從尾端對齊回 K 線時間
const alignToCandles = <T>(
  candles: QuantCandle[],
  values: T[],
  pick: (value: T) => number | undefined,
): IndicatorPoint[] => {
  const offset = candles.length - values.length;

  return values.flatMap((value, index) => {
    const picked = pick(value);

    return picked === undefined
      ? []
      : [{ time: candles[index + offset].time, value: picked }];
  });
};

export const computeOverlay = (
  indicator: OverlayIndicator,
  candles: QuantCandle[],
): IndicatorLine[] => {
  const values = candles.map(({ close }) => close);

  switch (indicator) {
    case "ma":
      return MA_PERIODS.map((period) => ({
        key: `MA(${period})`,
        points: alignToCandles(
          candles,
          SMA.calculate({ period, values }),
          (v) => v,
        ),
      }));
    case "ema":
      return EMA_PERIODS.map((period) => ({
        key: `EMA(${period})`,
        points: alignToCandles(
          candles,
          EMA.calculate({ period, values }),
          (v) => v,
        ),
      }));
    case "bollingerBands": {
      const bands = BollingerBands.calculate({ ...BOLLINGER, values });

      return (["upper", "middle", "lower"] as const).map((band) => ({
        key: `BOLL ${band}`,
        points: alignToCandles(candles, bands, (v) => v[band]),
      }));
    }
  }
};

export const computeRsi = (candles: QuantCandle[]): IndicatorPoint[] =>
  alignToCandles(
    candles,
    RSI.calculate({
      period: RSI_PERIOD,
      values: candles.map(({ close }) => close),
    }),
    (v) => v,
  );

export const computeMacd = (candles: QuantCandle[]) => {
  const result = MACD.calculate({
    ...MACD_PERIODS,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
    values: candles.map(({ close }) => close),
  });

  return {
    histogram: alignToCandles(candles, result, (v) => v.histogram),
    macd: alignToCandles(candles, result, (v) => v.MACD),
    signal: alignToCandles(candles, result, (v) => v.signal),
  };
};
