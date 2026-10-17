import {
  DEFAULT_QUANT_INTERVAL,
  DEFAULT_QUANT_SYMBOL,
} from "@/constants/quant";

import { quantCandleIntervalValues } from "@/types/api";
import type { QuantCandleInterval } from "@/types/quant";

const isInterval = (value?: string | null): value is QuantCandleInterval =>
  quantCandleIntervalValues.some((interval) => interval === value);

export const resolveQuantInterval = (
  value?: string | null,
): QuantCandleInterval => (isInterval(value) ? value : DEFAULT_QUANT_INTERVAL);

export const resolveQuantSymbol = (value?: string | null) =>
  value?.trim().toUpperCase() || DEFAULT_QUANT_SYMBOL;
