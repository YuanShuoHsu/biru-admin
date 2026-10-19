// https://tradingview.github.io/lightweight-charts/tutorials/how_to/series-markers
// https://tradingview.github.io/lightweight-charts/tutorials/how_to/price-line

"use client";

import { useEffect, useRef } from "react";

import {
  CandlestickSeries,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  LineStyle,
  type Time,
  type UTCTimestamp,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import { useFormatter } from "next-intl";
import useSWR from "swr";

import { useChartPalette } from "../../../useChartPalette";
import { QUANT_BOTS_URL } from "../../useQuantBots";

import { isIntradayInterval } from "@/constants/quant";

import { Box } from "@mui/material";

import type {
  FuturesGridConfig,
  GridConfig,
  IndicatorConfig,
  QuantBot,
  QuantBotFillMarker,
  QuantCandle,
  QuantCandleInterval,
} from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const CHART_CANDLES = 500;

const toTime = (ms: number) => Math.floor(ms / 1000) as UTCTimestamp;

// 和後端網格策略同一個算法，畫出來的格線就是實際掛單的價位
const gridLines = ({
  bottom,
  gridType,
  row,
  top,
}: FuturesGridConfig | GridConfig) =>
  Array.from({ length: row + 1 }, (_, index) =>
    gridType === "arithmetic"
      ? bottom + ((top - bottom) * index) / row
      : bottom * (top / bottom) ** (index / row),
  );

const chartInterval = (bot: QuantBot): QuantCandleInterval =>
  bot.type === "indicator" ? (bot.config as IndicatorConfig).interval : "15M";

interface BotChartProps {
  bot: QuantBot;
  pricePrecision: number;
}

const BotChart = ({ bot, pricePrecision }: BotChartProps) => {
  const format = useFormatter();
  const palette = useChartPalette();
  const interval = chartInterval(bot);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);

  const { data: candles } = useSWR<QuantCandle[]>(
    `/api/quant/markets/${bot.symbol}/candles?interval=${interval}&limit=${CHART_CANDLES}`,
    fetcher,
    { refreshInterval: 60_000 },
  );
  const since = candles?.length
    ? new Date(candles[0].time).toISOString()
    : null;
  const { data: fills = [] } = useSWR<QuantBotFillMarker[]>(
    since
      ? `${QUANT_BOTS_URL}/${bot.id}/fill-markers?since=${encodeURIComponent(since)}`
      : null,
    fetcher,
    { keepPreviousData: true },
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: { attributionLogo: true, background: { color: "transparent" } },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: isIntradayInterval(interval),
      },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      borderVisible: false,
    });
    markersRef.current = createSeriesMarkers(seriesRef.current);

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      markersRef.current = null;
      linesRef.current = [];
    };
  }, [interval]);

  useEffect(() => {
    chartRef.current?.applyOptions({
      grid: {
        horzLines: { color: palette.grid },
        vertLines: { color: palette.grid },
      },
      layout: { textColor: palette.text },
      localization: {
        priceFormatter: (price: number) =>
          format.number(price, {
            maximumFractionDigits: pricePrecision,
            minimumFractionDigits: pricePrecision,
          }),
        timeFormatter: (time: UTCTimestamp) =>
          format.dateTime(new Date(time * 1000), "compact"),
      },
    });
    seriesRef.current?.applyOptions({
      downColor: palette.down,
      upColor: palette.up,
      wickDownColor: palette.down,
      wickUpColor: palette.up,
    });
  }, [format, palette, pricePrecision]);

  useEffect(() => {
    if (!candles) return;

    seriesRef.current?.setData(
      candles.map(({ close, high, low, open, time }) => ({
        close,
        high,
        low,
        open,
        time: toTime(time),
      })),
    );
  }, [candles]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !candles?.length) return;

    const first = candles[0].time;
    // 成交時間要對齊到所在 K 線的開盤時間，標記才會落在 K 線上
    const bucket = candles.length > 1 ? candles[1].time - first : 60_000;
    markersRef.current?.setMarkers(
      fills
        .map(({ filledAt, price, side }) => ({
          price,
          side,
          time: Date.parse(filledAt),
        }))
        .filter(({ time }) => time >= first)
        .map(({ side, time }) => ({
          color: side === "BUY" ? palette.up : palette.down,
          position:
            side === "BUY" ? ("belowBar" as const) : ("aboveBar" as const),
          shape: side === "BUY" ? ("arrowUp" as const) : ("arrowDown" as const),
          time: toTime(first + Math.floor((time - first) / bucket) * bucket),
        })),
    );

    for (const line of linesRef.current) series.removePriceLine(line);
    const { averageCost, liquidationPrice, position } = bot.summary;
    const levels = [
      ...(bot.type === "grid" || bot.type === "futures_grid"
        ? gridLines(bot.config as FuturesGridConfig | GridConfig).map(
            (price) => ({
              color: palette.text,
              price,
              style: LineStyle.Dotted,
            }),
          )
        : []),
      ...(bot.type !== "grid" && position !== 0 && averageCost > 0
        ? [
            {
              color: palette.lines[0],
              price: averageCost,
              style: LineStyle.Dashed,
            },
          ]
        : []),
      ...(liquidationPrice
        ? [
            {
              color: palette.down,
              price: liquidationPrice,
              style: LineStyle.Dashed,
            },
          ]
        : []),
    ];
    linesRef.current = levels.map(({ color, price, style }) =>
      series.createPriceLine({
        axisLabelVisible: false,
        color,
        lineStyle: style,
        lineWidth: 1,
        price,
      }),
    );
  }, [bot, candles, fills, palette]);

  return <Box ref={containerRef} sx={{ height: 420 }} />;
};

export default BotChart;
