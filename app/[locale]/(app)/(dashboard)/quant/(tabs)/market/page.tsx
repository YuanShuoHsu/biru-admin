import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { resolveQuantInterval, resolveQuantSymbol } from "./definitions";
import MarketTerminal from "./MarketTerminal";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

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

const QuantMarketPage = async ({
  params,
  searchParams,
}: QuantMarketPageProps) => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  const interval = resolveQuantInterval(query.interval);
  const symbol = resolveQuantSymbol(query.symbol);

  if (query.interval !== interval || query.symbol !== symbol)
    redirect({
      href: `/quant/market?${new URLSearchParams({ interval, symbol })}`,
      locale,
    });

  return <MarketTerminal interval={interval} symbol={symbol} />;
};

export default QuantMarketPage;
