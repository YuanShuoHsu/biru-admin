"use client";

import { useEffect, useMemo, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";

import {
  Autocomplete,
  Box,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { quantMarketTypeValues } from "@/types/api";
import type {
  QuantMarket,
  QuantMarketType,
  QuantPerpIndex,
} from "@/types/quant";

const HeaderPaper = styled(Paper)(({ theme }) => ({
  alignItems: "center",
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(3),
  padding: theme.spacing(2),
}));

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Stack>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Stack>
);

const toPair = ({ baseCurrency, quoteCurrency }: QuantMarket) =>
  `${baseCurrency}/${quoteCurrency}`;

const SECOND_MS = 1000;

const FundingCountdown = ({ until }: { until: number }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), SECOND_MS);

    return () => clearInterval(timer);
  }, []);

  const seconds = Math.max(0, Math.floor((until - now) / SECOND_MS));
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
};

const changeRatio = ({ close, open }: QuantMarket) =>
  open ? (close - open) / open : 0;

interface MarketHeaderProps {
  lastPrice: number;
  market: QuantMarket;
  markets: QuantMarket[];
  onMarketTypeChange: (type: QuantMarketType) => void;
  onSymbolChange: (symbol: string) => void;
  openInterest?: number;
  perpIndex?: QuantPerpIndex;
}

const MarketHeader = ({
  lastPrice,
  market,
  markets,
  onMarketTypeChange,
  onSymbolChange,
  openInterest,
  perpIndex,
}: MarketHeaderProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();

  const options = useMemo(
    () => [...markets].sort((a, b) => b.quoteVolume - a.quoteVolume),
    [markets],
  );

  const formatPercent = (ratio: number) =>
    format.number(ratio, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      signDisplay: "exceptZero",
      style: "percent",
    });
  const formatPrice = (value: number, { pricePrecision }: QuantMarket) =>
    format.number(value, {
      maximumFractionDigits: pricePrecision,
      minimumFractionDigits: pricePrecision,
    });
  const changeColor = (ratio: number) =>
    ratio > 0 ? "success.main" : ratio < 0 ? "error.main" : "text.primary";

  const change = changeRatio(market);

  return (
    <HeaderPaper>
      <ToggleButtonGroup
        aria-label={tQuant("market.marketType")}
        exclusive
        onChange={(_, value: QuantMarketType | null) =>
          value && onMarketTypeChange(value)
        }
        size="small"
        value={market.type}
      >
        {quantMarketTypeValues.map((value) => (
          <ToggleButton key={value} value={value}>
            {tQuant(`market.types.${value}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <Autocomplete
        disableClearable
        getOptionLabel={toPair}
        isOptionEqualToValue={(option, value) => option.symbol === value.symbol}
        onChange={(_, value) => onSymbolChange(value.symbol)}
        options={options}
        renderInput={(params) => (
          <TextField {...params} label={tQuant("market.symbol")} />
        )}
        renderOption={({ key, ...props }, option) => (
          <Box component="li" key={key} {...props}>
            <Stack
              sx={{
                flexDirection: "row",
                gap: 2,
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span>{toPair(option)}</span>
              <Box
                component="span"
                sx={{ color: changeColor(changeRatio(option)) }}
              >
                {formatPercent(changeRatio(option))}
              </Box>
            </Stack>
          </Box>
        )}
        size="small"
        sx={{ width: 220 }}
        value={market}
      />
      <Typography
        component="p"
        sx={{ color: changeColor(change), fontVariantNumeric: "tabular-nums" }}
        variant="h5"
      >
        {formatPrice(lastPrice, market)}
      </Typography>
      {perpIndex && (
        <>
          <Stat
            label={tQuant("market.markPrice")}
            value={formatPrice(perpIndex.markPrice, market)}
          />
          <Stat
            label={tQuant("market.indexPrice")}
            value={formatPrice(perpIndex.indexPrice, market)}
          />
          <Stat
            label={tQuant("market.funding")}
            value={
              <>
                {format.number(perpIndex.nextFundingRate, {
                  maximumFractionDigits: 4,
                  minimumFractionDigits: 4,
                  style: "percent",
                })}
                {" / "}
                <FundingCountdown until={perpIndex.nextFundingTime} />
              </>
            }
          />
        </>
      )}
      <Stat
        label={tQuant("market.change")}
        value={
          <Box component="span" sx={{ color: changeColor(change) }}>
            {formatPercent(change)}
          </Box>
        }
      />
      <Stat
        label={tQuant("market.high")}
        value={formatPrice(market.high, market)}
      />
      <Stat
        label={tQuant("market.low")}
        value={formatPrice(market.low, market)}
      />
      <Stat
        label={`${tQuant("market.volume")} (${market.baseCurrency})`}
        value={format.number(market.volume, { notation: "compact" })}
      />
      <Stat
        label={`${tQuant("market.quoteVolume")} (${market.quoteCurrency})`}
        value={format.number(market.quoteVolume, { notation: "compact" })}
      />
      {openInterest !== undefined && (
        <Stat
          label={`${tQuant("market.openInterest")} (${market.baseCurrency})`}
          value={format.number(openInterest, { notation: "compact" })}
        />
      )}
    </HeaderPaper>
  );
};

export default MarketHeader;
