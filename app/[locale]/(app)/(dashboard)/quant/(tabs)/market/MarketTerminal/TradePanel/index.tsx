"use client";

import { type BaseSyntheticEvent, useEffect, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";
import useSWR, { useSWRConfig } from "swr";

import {
  isQuantAccountKey,
  quantAccountUrl,
} from "../../../useQuantCredentials";
import {
  type OrderForm,
  floorToPrecision,
  useOrderFormSchema,
} from "./definitions";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import { Link } from "@/i18n/navigation";

import {
  Alert,
  Button,
  ButtonGroup,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import type {
  PlaceQuantOrderDto,
  PlaceQuantOrderResponse,
  QuantBalance,
  QuantCredential,
  QuantMarket,
  QuantOrderSide,
  QuantOrderType,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const PERCENTAGES = [0.25, 0.5, 0.75, 1];

interface TradePanelProps {
  credential?: QuantCredential;
  credentials: QuantCredential[];
  lastPrice: number;
  market: QuantMarket;
  onCredentialChange: (id: string) => void;
  pickedPrice: { price: number } | null;
}

const TradePanel = ({
  credential,
  credentials,
  lastPrice,
  market,
  onCredentialChange,
  pickedPrice,
}: TradePanelProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const { mutate } = useSWRConfig();

  const [side, setSide] = useState<QuantOrderSide>("BUY");
  const [type, setType] = useState<QuantOrderType>("LIMIT");

  const { data: balances } = useSWR<QuantBalance[]>(
    credential ? quantAccountUrl(credential.id, "balances") : null,
    fetcher,
  );
  const available = (coin: string) =>
    balances?.find((balance) => balance.coin === coin)?.free ?? 0;
  const baseAvailable = available(market.baseCurrency);
  const quoteAvailable = available(market.quoteCurrency);

  const schema = useOrderFormSchema({
    baseAvailable,
    market,
    quoteAvailable,
    side,
    type,
  });

  const {
    control,
    formState: { errors, isSubmitted, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<OrderForm>({
    defaultValues: { amount: "", price: "", size: "" },
    resolver: zodResolver(schema),
  });

  const [price, size] = useWatch({ control, name: ["price", "size"] });

  useEffect(() => {
    if (pickedPrice)
      setValue("price", pickedPrice.price.toFixed(market.pricePrecision));
  }, [market.pricePrecision, pickedPrice, setValue]);

  if (!credential)
    return (
      <Stack sx={{ gap: 2 }}>
        <Alert severity="info">{tQuant("account.noCredential")}</Alert>
        <Button component={Link} href="/quant/settings" variant="outlined">
          {tQuant("account.goToSettings")}
        </Button>
      </Stack>
    );

  const setOptions = { shouldValidate: isSubmitted };

  const fillPercentage = (ratio: number) => {
    if (side === "SELL")
      return setValue(
        "size",
        floorToPrecision(baseAvailable * ratio, market.sizePrecision),
        setOptions,
      );
    if (type === "MARKET")
      return setValue(
        "amount",
        floorToPrecision(quoteAvailable * ratio, market.amountPrecision),
        setOptions,
      );

    const limitPrice = Number(price) || lastPrice;
    setValue(
      "size",
      floorToPrecision(
        (quoteAvailable * ratio) / limitPrice,
        market.sizePrecision,
      ),
      setOptions,
    );
  };

  const onSubmitHandler = async ({ amount, price, size }: OrderForm) => {
    try {
      await fetcher<PlaceQuantOrderResponse>(
        quantAccountUrl(credential.id, "orders"),
        {
          body: JSON.stringify({
            side,
            symbol: market.symbol,
            type,
            ...(type === "LIMIT"
              ? { price, size }
              : side === "BUY"
                ? { amount }
                : { size }),
          } satisfies PlaceQuantOrderDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      enqueueSnackbar(tQuant("order.success"), { variant: "success" });
      reset({ amount: "", price, size: "" });
      void mutate(isQuantAccountKey(credential.id));
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  const isMarketBuy = type === "MARKET" && side === "BUY";
  const availableCoin =
    side === "BUY" ? market.quoteCurrency : market.baseCurrency;
  const total = Number(price) * Number(size);

  return (
    <FormBox noValidate onSubmit={onSubmit}>
      <Stack sx={{ alignItems: "center", flexDirection: "row", gap: 1 }}>
        <TextField
          fullWidth
          label={tQuant("order.credential")}
          onChange={(event) => onCredentialChange(event.target.value)}
          select
          size="small"
          value={credential.id}
        >
          {credentials.map(({ apiKeyLast4, id, label }) => (
            <MenuItem key={id} value={id}>
              {label} (…{apiKeyLast4})
            </MenuItem>
          ))}
        </TextField>
        <Chip color="warning" label={tQuant("order.live")} size="small" />
      </Stack>
      <ToggleButtonGroup
        exclusive
        fullWidth
        onChange={(_, value: QuantOrderSide | null) => {
          if (!value) return;
          setSide(value);
          reset({ amount: "", price, size: "" });
        }}
        size="small"
        value={side}
      >
        <ToggleButton color="success" value="BUY">
          {tQuant("order.side.BUY")}
        </ToggleButton>
        <ToggleButton color="error" value="SELL">
          {tQuant("order.side.SELL")}
        </ToggleButton>
      </ToggleButtonGroup>
      <Tabs
        onChange={(_, value: QuantOrderType) => {
          setType(value);
          reset({ amount: "", price, size: "" });
        }}
        value={type}
        variant="fullWidth"
      >
        <Tab label={tQuant("order.type.LIMIT")} value="LIMIT" />
        <Tab label={tQuant("order.type.MARKET")} value="MARKET" />
      </Tabs>
      <Typography color="text.secondary" variant="body2">
        {tQuant("order.available")}{" "}
        {format.number(side === "BUY" ? quoteAvailable : baseAvailable, {
          maximumFractionDigits:
            side === "BUY" ? market.pricePrecision : market.sizePrecision,
        })}{" "}
        {availableCoin}
      </Typography>
      {type === "LIMIT" && (
        <TextField
          {...register("price")}
          error={!!errors.price}
          helperText={errors.price?.message}
          label={tQuant("order.price")}
          required
          size="small"
          slotProps={{
            htmlInput: { inputMode: "decimal" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {market.quoteCurrency}
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      {isMarketBuy ? (
        <TextField
          {...register("amount")}
          error={!!errors.amount}
          helperText={errors.amount?.message}
          label={tQuant("order.amount")}
          required
          size="small"
          slotProps={{
            htmlInput: { inputMode: "decimal" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {market.quoteCurrency}
                </InputAdornment>
              ),
            },
          }}
        />
      ) : (
        <TextField
          {...register("size")}
          error={!!errors.size}
          helperText={errors.size?.message}
          label={tQuant("order.size")}
          required
          size="small"
          slotProps={{
            htmlInput: { inputMode: "decimal" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  {market.baseCurrency}
                </InputAdornment>
              ),
            },
          }}
        />
      )}
      <ButtonGroup fullWidth size="small" variant="outlined">
        {PERCENTAGES.map((ratio) => (
          <Button key={ratio} onClick={() => fillPercentage(ratio)}>
            {format.number(ratio, { style: "percent" })}
          </Button>
        ))}
      </ButtonGroup>
      {type === "LIMIT" && (
        <Typography color="text.secondary" variant="body2">
          {tQuant("order.total")}{" "}
          {Number.isFinite(total) && total > 0
            ? format.number(total, {
                maximumFractionDigits: market.pricePrecision,
              })
            : "—"}{" "}
          {market.quoteCurrency}
        </Typography>
      )}
      <Button
        color={side === "BUY" ? "success" : "error"}
        loading={isSubmitting}
        type="submit"
        variant="contained"
      >
        {tQuant("order.submit", {
          coin: market.baseCurrency,
          side: tQuant(`order.side.${side}`),
        })}
      </Button>
    </FormBox>
  );
};

export default TradePanel;
