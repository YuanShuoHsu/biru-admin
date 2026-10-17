// https://tradingview.github.io/lightweight-charts/tutorials/demos/infinite-history
// https://tradingview.github.io/lightweight-charts/tutorials/how_to/panes

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  CandlestickSeries,
  type CandlestickData,
  CrosshairMode,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  type LogicalRange,
  type MouseEventParams,
  TickMarkType,
  type UTCTimestamp,
  createChart,
} from "lightweight-charts";
import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { CHART_HEIGHT } from "../styled";
import {
  type Indicator,
  type IndicatorPoint,
  OVERLAY_INDICATORS,
  PANE_INDICATORS,
  computeMacd,
  computeOverlay,
  computeRsi,
} from "./indicators";
import { type ChartPalette, useChartPalette } from "./useChartPalette";

import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { quantCandleIntervalValues } from "@/types/api";
import type { QuantCandle, QuantCandleInterval } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const LOAD_MORE_THRESHOLD = 20;
const INDICATORS_STORAGE_KEY = "quant.chart.indicators";

const ChartContainer = styled(Box)({
  height: CHART_HEIGHT,
  position: "relative",
});

const Legend = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: theme.spacing(1.5),
  left: theme.spacing(1),
  pointerEvents: "none",
  position: "absolute",
  top: theme.spacing(0.5),
  zIndex: 1,
}));

const toTime = (ms: number) => (ms / 1000) as UTCTimestamp;

const toLineData = (points: IndicatorPoint[]) =>
  points.map(({ time, value }) => ({ time: toTime(time), value }));

const readStoredIndicators = (): Indicator[] => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(INDICATORS_STORAGE_KEY) ?? '["ma"]',
    ) as unknown;
    const known: readonly string[] = [
      ...OVERLAY_INDICATORS,
      ...PANE_INDICATORS,
    ];

    return Array.isArray(stored)
      ? stored.filter((value): value is Indicator => known.includes(value))
      : [];
  } catch {
    return ["ma"];
  }
};

interface CandleChartProps {
  interval: QuantCandleInterval;
  liveCandle: QuantCandle | null;
  onIntervalChange: (interval: QuantCandleInterval) => void;
  pricePrecision: number;
  symbol: string;
}

const CandleChart = ({
  interval,
  liveCandle,
  onIntervalChange,
  pricePrecision,
  symbol,
}: CandleChartProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const palette = useChartPalette();

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<ISeriesApi<"Line" | "Histogram">[]>([]);
  const candlesRef = useRef<QuantCandle[]>([]);
  const paletteRef = useRef<ChartPalette>(palette);

  const [indicators, setIndicators] =
    useState<Indicator[]>(readStoredIndicators);
  const [hovered, setHovered] = useState<QuantCandle | null>(null);

  const { data: candles } = useSWR<QuantCandle[]>(
    `/api/quant/markets/${symbol}/candles?interval=${interval}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const renderIndicators = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    for (const series of indicatorSeriesRef.current) chart.removeSeries(series);
    indicatorSeriesRef.current = [];

    const data = candlesRef.current;
    const { down, lines, up } = paletteRef.current;
    const priceFormat = {
      minMove: 10 ** -pricePrecision,
      precision: pricePrecision,
      type: "price" as const,
    };
    const lineOptions = {
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      lineWidth: 1 as const,
      priceLineVisible: false,
    };

    for (const indicator of OVERLAY_INDICATORS) {
      if (!indicators.includes(indicator)) continue;

      computeOverlay(indicator, data).forEach(({ key, points }, index) => {
        const series = chart.addSeries(LineSeries, {
          ...lineOptions,
          color: lines[index % lines.length],
          priceFormat,
          title: key,
        });
        series.setData(toLineData(points));
        indicatorSeriesRef.current.push(series);
      });
    }

    let paneIndex = 1;

    if (indicators.includes("rsi")) {
      const series = chart.addSeries(
        LineSeries,
        { ...lineOptions, color: lines[1], title: "RSI(14)" },
        paneIndex++,
      );
      series.setData(toLineData(computeRsi(data)));
      indicatorSeriesRef.current.push(series);
    }

    if (indicators.includes("macd")) {
      const { histogram, macd, signal } = computeMacd(data);
      const pane = paneIndex++;

      const histogramSeries = chart.addSeries(
        HistogramSeries,
        { lastValueVisible: false, priceLineVisible: false },
        pane,
      );
      histogramSeries.setData(
        histogram.map(({ time, value }) => ({
          color: value >= 0 ? up : down,
          time: toTime(time),
          value,
        })),
      );
      const macdSeries = chart.addSeries(
        LineSeries,
        { ...lineOptions, color: lines[2], title: "MACD(12,26,9)" },
        pane,
      );
      macdSeries.setData(toLineData(macd));
      const signalSeries = chart.addSeries(
        LineSeries,
        { ...lineOptions, color: lines[0] },
        pane,
      );
      signalSeries.setData(toLineData(signal));

      indicatorSeriesRef.current.push(
        histogramSeries,
        macdSeries,
        signalSeries,
      );
    }
  }, [indicators, pricePrecision]);

  const renderCandles = useCallback(() => {
    const { downVolume, upVolume } = paletteRef.current;

    candleSeriesRef.current?.setData(
      candlesRef.current.map(
        ({ close, high, low, open, time }): CandlestickData => ({
          close,
          high,
          low,
          open,
          time: toTime(time),
        }),
      ),
    );
    volumeSeriesRef.current?.setData(
      candlesRef.current.map(({ close, open, time, volume }) => ({
        color: close >= open ? upVolume : downVolume,
        time: toTime(time),
        value: volume,
      })),
    );
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      crosshair: { mode: CrosshairMode.Normal },
      layout: { attributionLogo: true, background: { color: "transparent" } },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, rightOffset: 5 },
    });
    chartRef.current = chart;

    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      borderVisible: false,
    });
    volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      priceFormat: { type: "volume" },
      priceLineVisible: false,
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { bottom: 0, top: 0.8 },
    });

    const handleCrosshairMove = ({ time }: MouseEventParams) => {
      setHovered(
        (time !== undefined &&
          candlesRef.current.find((c) => toTime(c.time) === time)) ||
          null,
      );
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current = [];
    };
  }, []);

  useEffect(() => {
    paletteRef.current = palette;

    chartRef.current?.applyOptions({
      grid: {
        horzLines: { color: palette.grid },
        vertLines: { color: palette.grid },
      },
      layout: {
        panes: { separatorColor: palette.grid },
        textColor: palette.text,
      },
    });
    candleSeriesRef.current?.applyOptions({
      downColor: palette.down,
      upColor: palette.up,
      wickDownColor: palette.down,
      wickUpColor: palette.up,
    });

    renderCandles();
    renderIndicators();
  }, [palette, renderCandles, renderIndicators]);

  useEffect(() => {
    const intraday = interval !== "1D";

    chartRef.current?.applyOptions({
      localization: {
        priceFormatter: (price: number) =>
          format.number(price, {
            maximumFractionDigits: pricePrecision,
            minimumFractionDigits: pricePrecision,
          }),
        timeFormatter: (time: UTCTimestamp) =>
          format.dateTime(new Date(time * 1000), intraday ? "compact" : "date"),
      },
      timeScale: {
        secondsVisible: false,
        tickMarkFormatter: (time: UTCTimestamp, type: TickMarkType) =>
          format.dateTime(
            new Date(time * 1000),
            type === TickMarkType.Time
              ? "time"
              : type === TickMarkType.Year
                ? "date"
                : "monthDay",
          ),
        timeVisible: intraday,
      },
    });
  }, [format, interval, pricePrecision]);

  useEffect(() => {
    candleSeriesRef.current?.applyOptions({
      priceFormat: {
        minMove: 10 ** -pricePrecision,
        precision: pricePrecision,
        type: "price",
      },
    });
  }, [pricePrecision]);

  useEffect(() => {
    try {
      localStorage.setItem(INDICATORS_STORAGE_KEY, JSON.stringify(indicators));
    } catch {}
  }, [indicators]);

  useEffect(() => {
    candlesRef.current = [...(candles ?? [])];
    renderCandles();
    renderIndicators();
    chartRef.current?.timeScale().scrollToRealTime();
  }, [candles, renderCandles, renderIndicators]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !candles) return;

    let loading = false;
    let hasMore = true;
    let disposed = false;

    const handleRangeChange = (range: LogicalRange | null) => {
      const first = candlesRef.current[0];
      if (!range || range.from > LOAD_MORE_THRESHOLD) return;
      if (!first || loading || !hasMore) return;

      loading = true;
      fetcher<QuantCandle[]>(
        `/api/quant/markets/${symbol}/candles?interval=${interval}&endTime=${first.time - 1}`,
      )
        .then((older) => {
          if (disposed) return;

          const fresh = older.filter(({ time }) => time < first.time);
          if (!fresh.length) return void (hasMore = false);

          candlesRef.current = [...fresh, ...candlesRef.current];
          renderCandles();
          renderIndicators();
        })
        // Pionex 最多只能往回取 10000 根，超過就回錯誤
        .catch(() => (hasMore = false))
        .finally(() => (loading = false));
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRangeChange);

    return () => {
      disposed = true;
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRangeChange);
    };
  }, [candles, interval, renderCandles, renderIndicators, symbol]);

  useEffect(() => {
    const data = candlesRef.current;
    const last = data.at(-1);
    if (!liveCandle || !last || liveCandle.time < last.time) return;

    if (liveCandle.time === last.time) data[data.length - 1] = liveCandle;
    else data.push(liveCandle);

    const { close, high, low, open, time, volume } = liveCandle;
    const { downVolume, upVolume } = paletteRef.current;
    candleSeriesRef.current?.update({
      close,
      high,
      low,
      open,
      time: toTime(time),
    });
    volumeSeriesRef.current?.update({
      color: close >= open ? upVolume : downVolume,
      time: toTime(time),
      value: volume,
    });
    renderIndicators();
  }, [liveCandle, renderIndicators]);

  const legendCandle = hovered ?? liveCandle ?? candles?.at(-1);
  const formatPrice = (value: number) =>
    format.number(value, {
      maximumFractionDigits: pricePrecision,
      minimumFractionDigits: pricePrecision,
    });

  return (
    <Stack sx={{ flex: 1, gap: 1, minWidth: 0 }}>
      <Stack
        sx={{
          alignItems: "center",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: "space-between",
        }}
      >
        <ToggleButtonGroup
          aria-label={tQuant("market.label")}
          exclusive
          onChange={(_, value: QuantCandleInterval | null) =>
            value && onIntervalChange(value)
          }
          size="small"
          value={interval}
        >
          {quantCandleIntervalValues.map((value) => (
            <ToggleButton key={value} value={value}>
              {tQuant(`intervals.${value}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          aria-label={tQuant("indicators.label")}
          onChange={(_, value: Indicator[]) => setIndicators(value)}
          size="small"
          value={indicators}
        >
          {[...OVERLAY_INDICATORS, ...PANE_INDICATORS].map((value) => (
            <ToggleButton key={value} value={value}>
              {tQuant(`indicators.${value}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <ChartContainer ref={containerRef}>
        {legendCandle && (
          <Legend>
            {(["open", "high", "low", "close"] as const).map((key) => (
              <Typography key={key} variant="caption">
                {key.charAt(0).toUpperCase()}{" "}
                <Box
                  component="span"
                  sx={{
                    color:
                      legendCandle.close >= legendCandle.open
                        ? "success.main"
                        : "error.main",
                  }}
                >
                  {formatPrice(legendCandle[key])}
                </Box>
              </Typography>
            ))}
            <Typography variant="caption">
              V {format.number(legendCandle.volume, "precise")}
            </Typography>
          </Legend>
        )}
      </ChartContainer>
    </Stack>
  );
};

export default CandleChart;
