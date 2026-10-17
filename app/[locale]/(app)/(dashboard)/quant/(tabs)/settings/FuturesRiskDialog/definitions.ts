import { useTranslations } from "next-intl";
import * as z from "zod";

import type {
  QuantFuturesRisk,
  UpdateQuantFuturesRiskDto,
} from "@/types/quant";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

export const useFuturesRiskFormSchema = () => {
  const tQuant = useTranslations("quant");

  const optionalPositive = (check?: (value: number) => string | null) =>
    z
      .string()
      .trim()
      .superRefine((value, ctx) => {
        if (!value) return;
        const issue =
          !DECIMAL_PATTERN.test(value) || Number(value) <= 0
            ? tQuant("order.validation.positive")
            : (check?.(Number(value)) ?? null);
        if (issue) ctx.addIssue({ code: "custom", message: issue });
      });

  return z.object({
    maxDailyLoss: optionalPositive(),
    maxLeverage: optionalPositive((value) =>
      Number.isInteger(value) ? null : tQuant("settings.risk.integer"),
    ),
    minLiquidationDistance: optionalPositive((value) =>
      value >= 100
        ? tQuant("order.validation.range", { max: 100, min: 0 })
        : null,
    ),
  });
};

export type FuturesRiskForm = z.infer<
  ReturnType<typeof useFuturesRiskFormSchema>
>;

const toText = (value: number | null) => (value === null ? "" : String(value));

export const valuesFromRisk = (risk: QuantFuturesRisk): FuturesRiskForm => ({
  maxDailyLoss: toText(risk.maxDailyLoss),
  maxLeverage: toText(risk.maxLeverage),
  minLiquidationDistance:
    risk.minLiquidationDistance === null
      ? ""
      : String(Number((risk.minLiquidationDistance * 100).toPrecision(12))),
});

const toNumber = (value: string) => (value === "" ? null : Number(value));

export const toRiskDto = (
  values: FuturesRiskForm,
): UpdateQuantFuturesRiskDto => ({
  maxDailyLoss: toNumber(values.maxDailyLoss),
  maxLeverage: toNumber(values.maxLeverage),
  minLiquidationDistance:
    values.minLiquidationDistance === ""
      ? null
      : Number(values.minLiquidationDistance) / 100,
});
