"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import useSWR from "swr";

import MarketHeader from "./MarketHeader";
import OrderBook from "./OrderBook";
import RecentTrades from "./RecentTrades";
import { Board, Panel, SidePanel } from "./styled";
import { useMarketStream } from "./useMarketStream";

import { useRouter } from "@/i18n/navigation";

import { Alert, Skeleton, Stack } from "@mui/material";

import type {
  QuantCandle,
  QuantCandleInterval,
  QuantDepth,
  QuantMarket,
  QuantTrade,
} from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const CandleChart = dynamic(() => import("./CandleChart"), { ssr: false });

const MARKETS_REFRESH_MS = 10 * 1000;
const RECENT_TRADES_LIMIT = 50;

interface MarketTerminalProps {
  interval: QuantCandleInterval;
  symbol: string;
}

const MarketTerminal = ({ interval, symbol }: MarketTerminalProps) => {
  const tQuant = useTranslations("quant");
  const router = useRouter();

  const { data: markets } = useSWR<QuantMarket[]>(
    "/api/quant/markets",
    fetcher,
    { refreshInterval: MARKETS_REFRESH_MS },
  );
  const market = markets?.find((m) => m.symbol === symbol);

  const [streamKey, setStreamKey] = useState(symbol);
  const [depth, setDepth] = useState<QuantDepth | null>(null);
  const [liveCandle, setLiveCandle] = useState<QuantCandle | null>(null);
  const [liveTrades, setLiveTrades] = useState<QuantTrade[]>([]);

  if (streamKey !== symbol) {
    setStreamKey(symbol);
    setDepth(null);
    setLiveCandle(null);
    setLiveTrades([]);
  }

  const { isConnected } = useMarketStream(symbol, interval, {
    onCandle: setLiveCandle,
    onDepth: setDepth,
    onTrades: (trades) =>
      setLiveTrades((previous) =>
        [...trades]
          .sort((a, b) => b.time - a.time)
          .concat(previous)
          .slice(0, RECENT_TRADES_LIMIT),
      ),
  });

  const navigate = (next: {
    interval?: QuantCandleInterval;
    symbol?: string;
  }) =>
    router.replace(
      `/quant?${new URLSearchParams({ interval, symbol, ...next })}`,
    );

  if (markets && !market)
    return <Alert severity="error">{tQuant("market.notFound")}</Alert>;

  return (
    <Stack sx={{ gap: 2 }}>
      {market ? (
        <MarketHeader
          lastPrice={liveTrades[0]?.price ?? market.close}
          market={market}
          markets={markets ?? []}
          onSymbolChange={(value) => navigate({ symbol: value })}
        />
      ) : (
        <Skeleton height={72} variant="rounded" />
      )}
      {!isConnected && (
        <Alert severity="warning">{tQuant("market.disconnected")}</Alert>
      )}
      <Board>
        <Panel sx={{ flex: 1, minWidth: 0 }}>
          <CandleChart
            interval={interval}
            liveCandle={liveCandle}
            onIntervalChange={(value) => navigate({ interval: value })}
            pricePrecision={market?.pricePrecision ?? 2}
            symbol={symbol}
          />
        </Panel>
        <SidePanel>
          <Panel>
            <OrderBook depth={depth} market={market} />
          </Panel>
          <Panel>
            <RecentTrades
              liveTrades={liveTrades}
              market={market}
              symbol={symbol}
            />
          </Panel>
        </SidePanel>
      </Board>
    </Stack>
  );
};

export default MarketTerminal;
