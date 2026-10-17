import { useTranslations } from "next-intl";
import * as z from "zod";

import { decimalPlaces } from "../TradePanel/definitions";

import type {
  QuantFuturesOrderType,
  QuantMarket,
  QuantOrderSide,
  QuantPositionSide,
} from "@/types/quant";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export const LIMIT_TIME_IN_FORCE = ["LIMIT", "POSTONLY", "IOC", "FOK"] as const;

export interface FuturesOrderAction {
  positionSide: QuantPositionSide;
  reduceOnly: boolean;
  side: QuantOrderSide;
}

// 雙向持倉的反方向單、單向持倉的只減倉單才是平倉
export const isClosingAction = ({
  positionSide,
  reduceOnly,
  side,
}: FuturesOrderAction) =>
  positionSide === "BOTH"
    ? reduceOnly
    : (positionSide === "LONG") === (side === "SELL");

export interface FuturesOrderFormContext {
  lastPrice: number;
  market: QuantMarket;
  type: QuantFuturesOrderType;
}

export const useFuturesOrderFormSchema = ({
  lastPrice,
  market,
  type,
}: FuturesOrderFormContext) => {
  const tQuant = useTranslations("quant");
  const isMarket = type === "MARKET_QTY";
  const minSize = isMarket
    ? (market.perp?.minMarketSize ?? market.minTradeSize)
    : market.minTradeSize;
  const maxSize = isMarket
    ? (market.perp?.maxMarketSize ?? market.maxTradeSize)
    : market.maxTradeSize;

  return z
    .object({ price: z.string(), size: z.string() })
    .superRefine(({ price, size }, ctx) => {
      const checkDecimal = (
        path: "price" | "size",
        value: string,
        precision: number,
      ) => {
        const issue = !value
          ? tQuant("order.validation.required")
          : !DECIMAL_PATTERN.test(value) || Number(value) <= 0
            ? tQuant("order.validation.positive")
            : decimalPlaces(value) > precision
              ? tQuant("order.validation.decimals", { precision })
              : null;
        if (issue)
          ctx.addIssue({ code: "custom", message: issue, path: [path] });

        return !issue;
      };

      const priceValid =
        isMarket || checkDecimal("price", price, market.pricePrecision);
      if (!checkDecimal("size", size, market.sizePrecision) || !priceValid)
        return;

      const sizeValue = Number(size);
      const sizeIssue =
        sizeValue < minSize
          ? tQuant("order.validation.minSize", { min: minSize })
          : sizeValue > maxSize
            ? tQuant("order.validation.maxSize", { max: maxSize })
            : null;
      if (sizeIssue) {
        ctx.addIssue({ code: "custom", message: sizeIssue, path: ["size"] });
        return;
      }

      if (sizeValue * (isMarket ? lastPrice : Number(price)) < market.minAmount)
        ctx.addIssue({
          code: "custom",
          message: tQuant("order.validation.minAmount", {
            coin: market.quoteCurrency,
            min: market.minAmount,
          }),
          path: ["size"],
        });
    });
};

export type FuturesOrderForm = z.infer<
  ReturnType<typeof useFuturesOrderFormSchema>
>;
