import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import MarketTerminal from "./MarketTerminal";

import type { Locale } from "@/i18n/routing";

import {
  DEFAULT_QUANT_INTERVAL,
  DEFAULT_QUANT_SYMBOL,
} from "@/constants/quant";

import { quantCandleIntervalValues } from "@/types/api";
import type { QuantCandleInterval } from "@/types/quant";

interface QuantMarketPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ interval?: string; symbol?: string }>;
}

export const generateMetadata = async ({
  params,
}: QuantMarketPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tQuant = await getTranslations({ locale, namespace: "quant" });

  return { title: tQuant("label") };
};

const isInterval = (value?: string): value is QuantCandleInterval =>
  quantCandleIntervalValues.some((interval) => interval === value);

const QuantMarketPage = async ({ searchParams }: QuantMarketPageProps) => {
  const { interval, symbol } = await searchParams;

  return (
    <MarketTerminal
      interval={isInterval(interval) ? interval : DEFAULT_QUANT_INTERVAL}
      symbol={symbol?.toUpperCase() || DEFAULT_QUANT_SYMBOL}
    />
  );
};

export default QuantMarketPage;
