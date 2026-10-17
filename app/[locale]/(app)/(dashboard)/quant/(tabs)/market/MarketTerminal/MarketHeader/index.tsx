"use client";

import { useMemo } from "react";

import { useFormatter, useTranslations } from "next-intl";

import {
  Autocomplete,
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { QuantMarket } from "@/types/quant";

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

const changeRatio = ({ close, open }: QuantMarket) =>
  open ? (close - open) / open : 0;

interface MarketHeaderProps {
  lastPrice: number;
  market: QuantMarket;
  markets: QuantMarket[];
  onSymbolChange: (symbol: string) => void;
}

const MarketHeader = ({
  lastPrice,
  market,
  markets,
  onSymbolChange,
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
    </HeaderPaper>
  );
};

export default MarketHeader;
