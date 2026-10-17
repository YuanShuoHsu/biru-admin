"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";

import type { QuantDepth, QuantMarket } from "@/types/quant";

const VISIBLE_LEVELS = 10;

const Row = styled(Box)(({ theme }) => ({
  display: "grid",
  fontVariantNumeric: "tabular-nums",
  gridTemplateColumns: "1fr 1fr 1fr",
  padding: theme.spacing(0.25, 0.5),
  position: "relative",
  ...theme.typography.caption,
  "& > :not(:first-of-type)": { textAlign: "right" },
}));

const accumulate = (levels: QuantDepth["bids"]) => {
  let total = 0;

  return levels.slice(0, VISIBLE_LEVELS).map(([price, size]) => {
    total += size;

    return { price, size, total };
  });
};

interface OrderBookProps {
  depth: QuantDepth | null;
  market?: QuantMarket;
  onPriceClick: (price: number) => void;
}

const OrderBook = ({ depth, market, onPriceClick }: OrderBookProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();

  const header = (
    <Row sx={{ color: "text.secondary" }}>
      <span>{tQuant("orderBook.price")}</span>
      <span>{tQuant("orderBook.size")}</span>
      <span>{tQuant("orderBook.total")}</span>
    </Row>
  );

  if (!depth || !market)
    return (
      <Stack sx={{ gap: 1 }}>
        <Typography variant="subtitle2">{tQuant("orderBook.label")}</Typography>
        {header}
        <Skeleton height={420} variant="rounded" />
      </Stack>
    );

  const asks = accumulate(depth.asks);
  const bids = accumulate(depth.bids);
  const maxTotal = Math.max(asks.at(-1)?.total ?? 0, bids.at(-1)?.total ?? 0);

  const formatPrice = (value: number) =>
    format.number(value, {
      maximumFractionDigits: market.pricePrecision,
      minimumFractionDigits: market.pricePrecision,
    });
  const formatSize = (value: number) =>
    format.number(value, { maximumFractionDigits: market.sizePrecision });

  const renderLevel = (
    { price, size, total }: ReturnType<typeof accumulate>[number],
    side: "ask" | "bid",
  ) => (
    <Row
      key={price}
      onClick={() => onPriceClick(price)}
      sx={(theme) => ({
        cursor: "pointer",
        background: `linear-gradient(to left, ${alpha(
          side === "ask"
            ? theme.palette.error.main
            : theme.palette.success.main,
          0.15,
        )} ${(total / maxTotal) * 100}%, transparent 0)`,
      })}
    >
      <Box
        component="span"
        sx={{ color: side === "ask" ? "error.main" : "success.main" }}
      >
        {formatPrice(price)}
      </Box>
      <span>{formatSize(size)}</span>
      <span>{formatSize(total)}</span>
    </Row>
  );

  const bestAsk = asks[0]?.price;
  const bestBid = bids[0]?.price;

  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="subtitle2">{tQuant("orderBook.label")}</Typography>
      {header}
      {[...asks].reverse().map((level) => renderLevel(level, "ask"))}
      <Row sx={{ color: "text.secondary", py: 0.75 }}>
        <span>{tQuant("orderBook.spread")}</span>
        <span>
          {bestAsk !== undefined && bestBid !== undefined
            ? formatPrice(bestAsk - bestBid)
            : "—"}
        </span>
        <span />
      </Row>
      {bids.map((level) => renderLevel(level, "bid"))}
    </Stack>
  );
};

export default OrderBook;
