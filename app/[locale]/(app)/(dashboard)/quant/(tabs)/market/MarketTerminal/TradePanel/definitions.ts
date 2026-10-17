import { useTranslations } from "next-intl";
import * as z from "zod";

import type {
  QuantMarket,
  QuantOrderSide,
  QuantOrderType,
} from "@/types/quant";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export const decimalPlaces = (value: string) =>
  value.split(".")[1]?.length ?? 0;

// 浮點乘法可能把 4.9999… 往下截成 4，先以 15 位有效數字收斂再取整
export const floorToPrecision = (value: number, precision: number) => {
  const scaled = Math.floor(Number((value * 10 ** precision).toPrecision(15)));

  return (scaled / 10 ** precision)
    .toFixed(precision)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
};

export interface OrderFormContext {
  baseAvailable: number;
  market: QuantMarket;
  quoteAvailable: number;
  side: QuantOrderSide;
  type: QuantOrderType;
}

export const useOrderFormSchema = ({
  baseAvailable,
  market,
  quoteAvailable,
  side,
  type,
}: OrderFormContext) => {
  const tQuant = useTranslations("quant");

  return z
    .object({ amount: z.string(), price: z.string(), size: z.string() })
    .superRefine(({ amount, price, size }, ctx) => {
      const checkDecimal = (
        path: "amount" | "price" | "size",
        value: string,
        precision: number,
      ) => {
        if (!value) {
          ctx.addIssue({
            code: "custom",
            message: tQuant("order.validation.required"),
            path: [path],
          });
          return false;
        }
        if (!DECIMAL_PATTERN.test(value) || Number(value) <= 0) {
          ctx.addIssue({
            code: "custom",
            message: tQuant("order.validation.positive"),
            path: [path],
          });
          return false;
        }
        if (decimalPlaces(value) > precision) {
          ctx.addIssue({
            code: "custom",
            message: tQuant("order.validation.decimals", { precision }),
            path: [path],
          });
          return false;
        }

        return true;
      };

      const checkSize = () => {
        if (!checkDecimal("size", size, market.sizePrecision)) return false;

        const value = Number(size);
        if (value < market.minTradeSize)
          ctx.addIssue({
            code: "custom",
            message: tQuant("order.validation.minSize", {
              min: market.minTradeSize,
            }),
            path: ["size"],
          });
        else if (value > market.maxTradeSize)
          ctx.addIssue({
            code: "custom",
            message: tQuant("order.validation.maxSize", {
              max: market.maxTradeSize,
            }),
            path: ["size"],
          });
        else return true;

        return false;
      };

      const minAmountIssue = (path: "amount" | "size") => ({
        code: "custom" as const,
        message: tQuant("order.validation.minAmount", {
          coin: market.quoteCurrency,
          min: market.minAmount,
        }),
        path: [path],
      });
      const insufficientIssue = (path: "amount" | "size") => ({
        code: "custom" as const,
        message: tQuant("order.validation.insufficient"),
        path: [path],
      });

      if (type === "MARKET" && side === "BUY") {
        if (!checkDecimal("amount", amount, market.amountPrecision)) return;
        if (Number(amount) < market.minAmount)
          ctx.addIssue(minAmountIssue("amount"));
        else if (Number(amount) > quoteAvailable)
          ctx.addIssue(insufficientIssue("amount"));
        return;
      }

      if (type === "LIMIT") {
        const priceValid = checkDecimal("price", price, market.pricePrecision);
        if (!checkSize() || !priceValid) return;

        const total = Number(price) * Number(size);
        if (total < market.minAmount) ctx.addIssue(minAmountIssue("size"));
        else if (side === "BUY" && total > quoteAvailable)
          ctx.addIssue(insufficientIssue("size"));
      } else if (!checkSize()) return;

      if (side === "SELL" && Number(size) > baseAvailable)
        ctx.addIssue(insufficientIssue("size"));
    });
};

export type OrderForm = z.infer<ReturnType<typeof useOrderFormSchema>>;
