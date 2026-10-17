"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import useSWR from "swr";

import { useQuantCredentials } from "../../useQuantCredentials";
import AccountOrders from "./AccountOrders";
import FundingRates from "./FundingRates";
import FuturesAccount from "./FuturesAccount";
import FuturesTradePanel from "./FuturesTradePanel";
import MarketHeader from "./MarketHeader";
import OrderBook from "./OrderBook";
import RecentTrades from "./RecentTrades";
import TradePanel from "./TradePanel";
import { Board, Panel, SidePanel } from "./styled";
import { useAccountStream } from "./useAccountStream";
import { useMarketStream } from "./useMarketStream";

import { DEFAULT_QUANT_SYMBOLS, quantMarketTypeOf } from "@/constants/quant";

import { useRouter } from "@/i18n/navigation";

import { Alert, Skeleton, Stack } from "@mui/material";

import type {
  QuantCandle,
  QuantCandleInterval,
  QuantDepth,
  QuantMarket,
  QuantPerpIndex,
  QuantPerpInfo,
  QuantTrade,
} from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const CandleChart = dynamic(() => import("./CandleChart"), { ssr: false });

const MARKETS_REFRESH_MS = 10 * 1000;
const PERP_INFO_REFRESH_MS = 60 * 1000;
const RECENT_TRADES_LIMIT = 50;

interface MarketTerminalProps {
  interval: QuantCandleInterval;
  symbol: string;
}

const MarketTerminal = ({ interval, symbol }: MarketTerminalProps) => {
  const tQuant = useTranslations("quant");
  const router = useRouter();

  const marketType = quantMarketTypeOf(symbol);

  const { data: markets } = useSWR<QuantMarket[]>(
    `/api/quant/markets?type=${marketType}`,
    fetcher,
    { refreshInterval: MARKETS_REFRESH_MS },
  );
  const market = markets?.find((m) => m.symbol === symbol);
  const { data: perpInfo } = useSWR<QuantPerpInfo>(
    marketType === "PERP" ? `/api/quant/markets/${symbol}/perp` : null,
    fetcher,
    { refreshInterval: PERP_INFO_REFRESH_MS },
  );

  const [streamKey, setStreamKey] = useState(symbol);
  const [depth, setDepth] = useState<QuantDepth | null>(null);
  const [liveCandle, setLiveCandle] = useState<QuantCandle | null>(null);
  const [liveTrades, setLiveTrades] = useState<QuantTrade[]>([]);
  const [liveIndex, setLiveIndex] = useState<QuantPerpIndex | null>(null);
  const [pickedPrice, setPickedPrice] = useState<{ price: number } | null>(
    null,
  );

  if (streamKey !== symbol) {
    setStreamKey(symbol);
    setDepth(null);
    setLiveCandle(null);
    setLiveTrades([]);
    setLiveIndex(null);
    setPickedPrice(null);
  }

  const { isConnected } = useMarketStream(symbol, interval, {
    onCandle: setLiveCandle,
    onDepth: setDepth,
    onPerpIndex: setLiveIndex,
    onTrades: (trades) =>
      setLiveTrades((previous) =>
        [...trades]
          .sort((a, b) => b.time - a.time)
          .concat(previous)
          .slice(0, RECENT_TRADES_LIMIT),
      ),
  });

  const { credential, credentials, selectCredential } = useQuantCredentials();
  useAccountStream(credential?.id, symbol, isConnected);

  const lastPrice = liveTrades[0]?.price ?? market?.close ?? 0;

  const navigate = (next: {
    interval?: QuantCandleInterval;
    symbol?: string;
  }) =>
    router.replace(
      `/quant/market?${new URLSearchParams({ interval, symbol, ...next })}`,
    );

  if (markets && !market)
    return <Alert severity="error">{tQuant("market.notFound")}</Alert>;

  return (
    <Stack sx={{ gap: 2 }}>
      {!isConnected && (
        <Alert severity="warning">{tQuant("market.disconnected")}</Alert>
      )}
      {market ? (
        <MarketHeader
          lastPrice={lastPrice}
          market={market}
          markets={markets ?? []}
          onMarketTypeChange={(value) =>
            navigate({ symbol: DEFAULT_QUANT_SYMBOLS[value] })
          }
          onSymbolChange={(value) => navigate({ symbol: value })}
          openInterest={perpInfo?.openInterest}
          perpIndex={liveIndex ?? perpInfo}
        />
      ) : (
        <Skeleton height={72} variant="rounded" />
      )}
      <Board>
        <Stack sx={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Panel>
            <CandleChart
              interval={interval}
              liveCandle={liveCandle}
              onIntervalChange={(value) => navigate({ interval: value })}
              pricePrecision={market?.pricePrecision ?? 2}
              symbol={symbol}
            />
          </Panel>
          {market?.type === "PERP" && (
            <Panel>
              <FundingRates symbol={market.symbol} />
            </Panel>
          )}
          {market && credential && (
            <Panel>
              {market.type === "PERP" ? (
                <FuturesAccount
                  credential={credential}
                  market={market}
                  markets={markets ?? []}
                />
              ) : (
                <AccountOrders credential={credential} market={market} />
              )}
            </Panel>
          )}
        </Stack>
        <SidePanel>
          <Panel>
            <OrderBook
              depth={depth}
              market={market}
              onPriceClick={(price) => setPickedPrice({ price })}
            />
          </Panel>
          {market && credentials && (
            <Panel>
              {market.type === "PERP" ? (
                <FuturesTradePanel
                  credential={credential}
                  credentials={credentials}
                  lastPrice={lastPrice}
                  market={market}
                  onCredentialChange={selectCredential}
                  pickedPrice={pickedPrice}
                />
              ) : (
                <TradePanel
                  credential={credential}
                  credentials={credentials}
                  lastPrice={lastPrice}
                  market={market}
                  onCredentialChange={selectCredential}
                  pickedPrice={pickedPrice}
                />
              )}
            </Panel>
          )}
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
