"use client";

import { useFormatter, useTranslations } from "next-intl";
import useSWR from "swr";

import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { QuantMarket, QuantTrade } from "@/types/quant";

import { fetcher } from "@/utils/fetcher";

const VISIBLE_TRADES = 20;

const Row = styled(Box)(({ theme }) => ({
  display: "grid",
  fontVariantNumeric: "tabular-nums",
  gridTemplateColumns: "1fr 1fr 1fr",
  padding: theme.spacing(0.25, 0.5),
  ...theme.typography.caption,
  "& > :not(:first-of-type)": { textAlign: "right" },
}));

interface RecentTradesProps {
  liveTrades: QuantTrade[];
  market?: QuantMarket;
  symbol: string;
}

const RecentTrades = ({ liveTrades, market, symbol }: RecentTradesProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();

  const { data: initialTrades } = useSWR<QuantTrade[]>(
    `/api/quant/markets/${symbol}/trades`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const seen = new Set(liveTrades.map(({ id }) => id));
  const trades = [
    ...liveTrades,
    ...(initialTrades ?? []).filter(({ id }) => !seen.has(id)),
  ].slice(0, VISIBLE_TRADES);

  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="subtitle2">{tQuant("trades.label")}</Typography>
      <Row sx={{ color: "text.secondary" }}>
        <span>
          {market
            ? `${tQuant("trades.price")} (${market.quoteCurrency})`
            : tQuant("trades.price")}
        </span>
        <span>
          {market
            ? `${tQuant("trades.size")} (${market.baseCurrency})`
            : tQuant("trades.size")}
        </span>
        <span>{tQuant("trades.time")}</span>
      </Row>
      {!market || !initialTrades ? (
        <Skeleton height={400} variant="rounded" />
      ) : (
        trades.map(({ id, price, side, size, time }) => (
          <Row key={id}>
            <Box
              component="span"
              sx={{ color: side === "BUY" ? "success.main" : "error.main" }}
            >
              {format.number(price, {
                maximumFractionDigits: market.pricePrecision,
                minimumFractionDigits: market.pricePrecision,
              })}
            </Box>
            <span>
              {format.number(size, {
                maximumFractionDigits: market.sizePrecision,
              })}
            </span>
            <span>{format.dateTime(new Date(time), "timeWithSeconds")}</span>
          </Row>
        ))
      )}
    </Stack>
  );
};

export default RecentTrades;
