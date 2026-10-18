"use client";

import { useEffect, useMemo, useState } from "react";

import { useFormatter, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";
import useSWR, { useSWRConfig } from "swr";

import {
  isQuantAccountKey,
  quantAccountUrl,
} from "../../../useQuantCredentials";
import CredentialSelect, { NoCredential } from "../CredentialSelect";
import { floorToPrecision } from "../TradePanel/definitions";
import {
  type FuturesOrderAction,
  type FuturesOrderForm,
  LIMIT_TIME_IN_FORCE,
  isClosingAction,
  useFuturesOrderFormSchema,
} from "./definitions";
import {
  FUTURES_SETTINGS_FORM_ID,
  LeverageDialog,
  MarginModeDialog,
  PositionModeDialog,
} from "./SettingsDialogs";

import FormBox from "@/components/FormBox";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  PlaceFuturesOrderDto,
  PlaceQuantOrderResponse,
  QuantCredential,
  PreviewFuturesOrderDto,
  QuantFuturesAccount,
  QuantFuturesOrderPreview,
  QuantFuturesOrderType,
  QuantFuturesSymbolSettings,
  QuantMarket,
  QuantPosition,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const PERCENTAGES = [0.25, 0.5, 0.75, 1];
const PREVIEW_DEBOUNCE_MS = 800;
const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

type HedgeTab = "close" | "open";
type PriceType = "LIMIT" | "MARKET_QTY";

const actionKey = ({ positionSide, side }: FuturesOrderAction) =>
  `${side}:${positionSide}`;

const closableSizeOf = (
  positions: QuantPosition[] | undefined,
  { positionSide, side }: FuturesOrderAction,
) => {
  // 單向持倉只有一個淨部位，買單平空、賣單平多
  const direction =
    positionSide === "BOTH"
      ? side === "SELL"
        ? "LONG"
        : "SHORT"
      : positionSide;

  return Math.abs(
    positions?.find((position) => position.positionSide === direction)?.size ??
      0,
  );
};

interface FuturesTradePanelProps {
  credential?: QuantCredential;
  credentials: QuantCredential[];
  lastPrice: number;
  market: QuantMarket;
  onCredentialChange: (id: string) => void;
  pickedPrice: { price: number } | null;
}

const FuturesTradePanel = ({
  credential,
  credentials,
  lastPrice,
  market,
  onCredentialChange,
  pickedPrice,
}: FuturesTradePanelProps) => {
  const tQuant = useTranslations("quant");
  const format = useFormatter();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);

  const [priceType, setPriceType] = useState<PriceType>("LIMIT");
  const [timeInForce, setTimeInForce] =
    useState<(typeof LIMIT_TIME_IN_FORCE)[number]>("LIMIT");
  const [hedgeTab, setHedgeTab] = useState<HedgeTab>("open");
  const [reduceOnly, setReduceOnly] = useState(false);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const url = (path: string) =>
    credential ? quantAccountUrl(credential.id, `futures${path}`) : null;
  const symbolQuery = `?symbol=${market.symbol}`;

  const { data: account } = useSWR<QuantFuturesAccount>(url(""), fetcher);
  const { data: settings } = useSWR<QuantFuturesSymbolSettings>(
    url(`/settings${symbolQuery}`),
    fetcher,
  );
  const { data: positions } = useSWR<QuantPosition[]>(
    url(`/positions${symbolQuery}`),
    fetcher,
  );

  const type: QuantFuturesOrderType =
    priceType === "LIMIT" ? timeInForce : "MARKET_QTY";
  const schema = useFuturesOrderFormSchema({ lastPrice, market, type });

  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<FuturesOrderForm>({
    defaultValues: { price: "", size: "" },
    resolver: zodResolver(schema),
  });

  const [price, size] = useWatch({ control, name: ["price", "size"] });

  // 每次試算要打好幾個交易所端點，停止輸入後才送
  const previewBody = useMemo(() => {
    const priced = type === "MARKET_QTY" || DECIMAL_PATTERN.test(price);
    if (!DECIMAL_PATTERN.test(size) || Number(size) <= 0 || !priced)
      return null;

    return JSON.stringify({
      price: type === "MARKET_QTY" ? undefined : price,
      size,
      symbol: market.symbol,
      type,
    } satisfies PreviewFuturesOrderDto);
  }, [market.symbol, price, size, type]);
  const [debouncedPreview, setDebouncedPreview] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedPreview(previewBody),
      PREVIEW_DEBOUNCE_MS,
    );

    return () => clearTimeout(timer);
  }, [previewBody]);
  const previewUrl = url("/orders/preview");
  const { data: preview } = useSWR<QuantFuturesOrderPreview>(
    previewUrl && debouncedPreview ? [previewUrl, debouncedPreview] : null,
    ([key, body]: [string, string]) =>
      fetcher<QuantFuturesOrderPreview>(key, {
        body,
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    { onError: () => {}, shouldRetryOnError: false },
  );

  useEffect(() => {
    if (pickedPrice)
      setValue("price", pickedPrice.price.toFixed(market.pricePrecision));
  }, [market.pricePrecision, pickedPrice, setValue]);

  if (!credential) return <NoCredential />;
  if (!account || !settings) return <Skeleton height={360} variant="rounded" />;

  const isHedge = account.positionMode === "OPENCLOSE";
  const available =
    account.balances.find(({ coin }) => coin === market.quoteCurrency)
      ?.available ?? 0;
  const orderPrice =
    priceType === "MARKET_QTY" ? lastPrice : Number(price) || lastPrice;
  const maxOpenSize = (available * settings.leverage) / orderPrice;

  const actions: FuturesOrderAction[] = isHedge
    ? hedgeTab === "open"
      ? [
          { positionSide: "LONG", reduceOnly: false, side: "BUY" },
          { positionSide: "SHORT", reduceOnly: false, side: "SELL" },
        ]
      : [
          { positionSide: "SHORT", reduceOnly: false, side: "BUY" },
          { positionSide: "LONG", reduceOnly: false, side: "SELL" },
        ]
    : [
        { positionSide: "BOTH", reduceOnly, side: "BUY" },
        { positionSide: "BOTH", reduceOnly, side: "SELL" },
      ];
  const isClosing = isClosingAction(actions[0]);

  const actionLabel = ({ positionSide, side }: FuturesOrderAction) =>
    isHedge
      ? tQuant(
          `futures.actions.${hedgeTab}${positionSide === "LONG" ? "Long" : "Short"}`,
        )
      : tQuant(`futures.actions.${side === "BUY" ? "buyLong" : "sellShort"}`);

  const revalidate = () => mutate(isQuantAccountKey(credential.id));

  const openSettings = (kind: "leverage" | "marginMode" | "positionMode") =>
    setDialog({
      content:
        kind === "leverage" ? (
          <LeverageDialog
            leverage={settings.leverage}
            maxLeverage={market.perp?.maxLeverage ?? settings.leverage}
            onSaved={revalidate}
            symbol={market.symbol}
            url={url("/leverage")!}
          />
        ) : kind === "marginMode" ? (
          <MarginModeDialog
            marginMode={settings.marginMode}
            onSaved={revalidate}
            symbol={market.symbol}
            url={url("/margin-mode")!}
          />
        ) : (
          <PositionModeDialog
            onSaved={revalidate}
            positionMode={account.positionMode}
            url={url("/position-mode")!}
          />
        ),
      formId: FUTURES_SETTINGS_FORM_ID,
      open: true,
      title: tQuant(`futures.settings.${kind}`),
    });

  const setOptions = { shouldValidate: isSubmitted };

  const fillPercentage = (ratio: number) => {
    const limit = isClosing
      ? closableSizeOf(positions, actions[0])
      : maxOpenSize;

    setValue(
      "size",
      floorToPrecision(limit * ratio, market.sizePrecision),
      setOptions,
    );
  };

  const submit = (action: FuturesOrderAction) =>
    handleSubmit(async ({ price, size }) => {
      const notional = Number(size) * orderPrice;
      if (isClosingAction(action)) {
        const closable = closableSizeOf(positions, action);
        if (Number(size) > closable)
          return setError("size", {
            message: tQuant("futures.validation.aboveClosable", {
              max: closable,
            }),
          });
      } else if (notional / settings.leverage > available)
        return setError("size", {
          message: tQuant("order.validation.insufficient"),
        });

      setSubmittingKey(actionKey(action));
      try {
        await fetcher<PlaceQuantOrderResponse>(url("/orders")!, {
          body: JSON.stringify({
            ...action,
            size,
            symbol: market.symbol,
            type,
            ...(type === "MARKET_QTY" ? {} : { price }),
          } satisfies PlaceFuturesOrderDto),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        enqueueSnackbar(tQuant("order.success"), { variant: "success" });
        reset({ price, size: "" });
      } catch (error) {
        enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      } finally {
        setSubmittingKey(null);
        void revalidate();
      }
    })();

  const quoteAdornment = {
    input: {
      endAdornment: (
        <InputAdornment position="end">{market.quoteCurrency}</InputAdornment>
      ),
    },
  };

  return (
    <FormBox noValidate onSubmit={(event) => event.preventDefault()}>
      <CredentialSelect
        credential={credential}
        credentials={credentials}
        onChange={onCredentialChange}
      />
      <ButtonGroup fullWidth size="small" variant="outlined">
        <Button onClick={() => openSettings("marginMode")}>
          {tQuant(`futures.marginModes.${settings.marginMode}`)}
        </Button>
        <Button onClick={() => openSettings("leverage")}>
          {settings.leverage}x
        </Button>
        <Button onClick={() => openSettings("positionMode")}>
          {tQuant(`futures.positionModes.${account.positionMode}`)}
        </Button>
      </ButtonGroup>
      {isHedge && (
        <Tabs
          onChange={(_, value: HedgeTab) => {
            setHedgeTab(value);
            reset({ price, size: "" });
          }}
          value={hedgeTab}
          variant="fullWidth"
        >
          <Tab label={tQuant("futures.open")} value="open" />
          <Tab label={tQuant("futures.close")} value="close" />
        </Tabs>
      )}
      <Tabs
        onChange={(_, value: PriceType) => {
          setPriceType(value);
          reset({ price, size: "" });
        }}
        value={priceType}
        variant="fullWidth"
      >
        <Tab label={tQuant("order.type.LIMIT")} value="LIMIT" />
        <Tab label={tQuant("order.type.MARKET")} value="MARKET_QTY" />
      </Tabs>
      {priceType === "LIMIT" && (
        <TextField
          label={tQuant("futures.timeInForce")}
          onChange={(event) =>
            setTimeInForce(
              event.target.value as (typeof LIMIT_TIME_IN_FORCE)[number],
            )
          }
          select
          size="small"
          value={timeInForce}
        >
          {LIMIT_TIME_IN_FORCE.map((value) => (
            <MenuItem key={value} value={value}>
              {tQuant(`futures.orderTypes.${value}`)}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Typography color="text.secondary" variant="body2">
        {tQuant("futures.availableMargin")}{" "}
        {format.number(available, {
          maximumFractionDigits: market.pricePrecision,
        })}{" "}
        {market.quoteCurrency}
      </Typography>
      {priceType === "LIMIT" && (
        <TextField
          {...register("price")}
          error={!!errors.price}
          helperText={errors.price?.message}
          label={tQuant("order.price")}
          required
          size="small"
          slotProps={{ htmlInput: { inputMode: "decimal" }, ...quoteAdornment }}
        />
      )}
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
      <ButtonGroup fullWidth size="small" variant="outlined">
        {PERCENTAGES.map((ratio) => (
          <Button key={ratio} onClick={() => fillPercentage(ratio)}>
            {format.number(ratio, { style: "percent" })}
          </Button>
        ))}
      </ButtonGroup>
      {!isHedge && (
        <FormControlLabel
          control={
            <Checkbox
              checked={reduceOnly}
              onChange={(event) => setReduceOnly(event.target.checked)}
              size="small"
            />
          }
          label={tQuant("futures.reduceOnly")}
        />
      )}
      <Typography color="text.secondary" variant="body2">
        {isClosing
          ? tQuant("futures.closable", {
              long: format.number(
                closableSizeOf(positions, {
                  positionSide: isHedge ? "LONG" : "BOTH",
                  reduceOnly: true,
                  side: "SELL",
                }),
                { maximumFractionDigits: market.sizePrecision },
              ),
              short: format.number(
                closableSizeOf(positions, {
                  positionSide: isHedge ? "SHORT" : "BOTH",
                  reduceOnly: true,
                  side: "BUY",
                }),
                { maximumFractionDigits: market.sizePrecision },
              ),
            })
          : tQuant("futures.margin", {
              margin:
                Number(size) > 0
                  ? format.number(
                      (Number(size) * orderPrice) / settings.leverage,
                      {
                        maximumFractionDigits: market.pricePrecision,
                      },
                    )
                  : "—",
              quote: market.quoteCurrency,
            })}
      </Typography>
      {!isClosing && preview && previewBody === debouncedPreview && (
        <Stack sx={{ gap: 0.5 }}>
          {(["long", "short"] as const).map((direction) => {
            const { liquidationDistance, liquidationPrice } =
              preview[direction];
            return (
              <Typography
                color="text.secondary"
                key={direction}
                variant="body2"
              >
                {tQuant(`futures.liquidationEstimate.${direction}`, {
                  distance:
                    liquidationDistance === undefined
                      ? "—"
                      : format.number(liquidationDistance, {
                          maximumFractionDigits: 2,
                          style: "percent",
                        }),
                  price:
                    liquidationPrice === undefined
                      ? "—"
                      : format.number(liquidationPrice, {
                          maximumFractionDigits: market.pricePrecision,
                        }),
                })}
              </Typography>
            );
          })}
          <Typography color="text.secondary" variant="caption">
            {tQuant("futures.liquidationEstimate.note")}
          </Typography>
        </Stack>
      )}
      <Stack sx={{ flexDirection: "row", gap: 1 }}>
        {actions.map((action) => (
          <Button
            color={action.side === "BUY" ? "success" : "error"}
            disabled={!!submittingKey && submittingKey !== actionKey(action)}
            fullWidth
            key={actionKey(action)}
            loading={submittingKey === actionKey(action)}
            onClick={() => void submit(action)}
            variant="contained"
          >
            {actionLabel(action)}
          </Button>
        ))}
      </Stack>
    </FormBox>
  );
};

export default FuturesTradePanel;
