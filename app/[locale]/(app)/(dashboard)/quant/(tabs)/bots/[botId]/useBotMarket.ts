import { useFormatter } from "next-intl";
import useSWR from "swr";

import { quantMarketTypeOf } from "@/constants/quant";

import type { QuantMarket } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

export const useBotMarket = (symbol?: string) => {
  const format = useFormatter();

  const { data: markets } = useSWR<QuantMarket[]>(
    symbol ? `/api/quant/markets?type=${quantMarketTypeOf(symbol)}` : null,
    fetcher,
  );

  const market = markets?.find((item) => item.symbol === symbol);
  const pricePrecision = market?.pricePrecision ?? 2;
  const sizePrecision = market?.sizePrecision ?? 6;
  const quote = market?.quoteCurrency ?? "";
  const base = market?.baseCurrency ?? "";

  const formatQuote = (value: number) =>
    `${format.number(value, { maximumFractionDigits: 2, minimumFractionDigits: 2, signDisplay: "negative" })} ${quote}`;
  const formatPrice = (value?: number) =>
    value === undefined
      ? "—"
      : format.number(value, {
          maximumFractionDigits: pricePrecision,
          minimumFractionDigits: pricePrecision,
        });
  const formatSize = (value?: number) =>
    value === undefined
      ? "—"
      : format.number(value, { maximumFractionDigits: sizePrecision });

  return {
    base,
    formatPrice,
    formatQuote,
    formatSize,
    market,
    pricePrecision,
    quote,
  };
};
