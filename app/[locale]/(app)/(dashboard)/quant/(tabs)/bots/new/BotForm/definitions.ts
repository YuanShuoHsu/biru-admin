import { useTranslations } from "next-intl";
import * as z from "zod";

import { quantMarketTypeOf } from "@/constants/quant";

import type {
  AiConfig,
  DcaConfig,
  FuturesGridConfig,
  GridConfig,
  IndicatorCondition,
  IndicatorConfig,
  QuantBot,
  FuturesPositionConfig,
  QuantBotMode,
  QuantBotType,
  QuantCandleInterval,
  QuantIndicatorKind,
  SignalBotConfig,
  WebhookConfig,
} from "@/types/quant";

export interface ConditionValues {
  band: "lower" | "upper";
  direction: "death" | "golden";
  fast: string;
  kind: QuantIndicatorKind;
  operator: "above" | "below";
  period: string;
  slow: string;
  stdDev: string;
  value: string;
}

export interface BotFormValues {
  ai: {
    effort: AiConfig["effort"];
    guideline: string;
    interval: QuantCandleInterval;
    locale: AiConfig["locale"];
    maxOrderAmount: string;
    monthlyCostLimit: string;
    stopLoss: string;
    takeProfit: string;
  };
  credentialId: string;
  /** 合約交易對才用：DCA、指標、Webhook 的方向與槓桿 */
  futures: { direction: "long" | "short"; leverage: string };
  dca: {
    baseOrderAmount: string;
    maxSafetyOrders: string;
    priceDeviation: string;
    safetyOrderAmount: string;
    stepScale: string;
    stopLoss: string;
    takeProfit: string;
    volumeScale: string;
  };
  grid: {
    bottom: string;
    closeModel: GridConfig["closeModel"];
    gridType: GridConfig["gridType"];
    lossStop: string;
    lossStopType: "price" | "profit_amount";
    profitStop: string;
    profitStopType: "price" | "profit_amount";
    row: string;
    top: string;
    triggerDirection: "above" | "below";
    triggerPrice: string;
  };
  indicator: {
    entry: ConditionValues[];
    exit: ConditionValues[];
    interval: QuantCandleInterval;
    orderAmount: string;
    stopLoss: string;
    takeProfit: string;
  };
  futuresGrid: {
    extraMargin: string;
    leverage: string;
    lossStopHigh: string;
    trend: FuturesGridConfig["trend"];
  };
  investment: string;
  maxDailyLoss: string;
  mode: QuantBotMode;
  name: string;
  paperFeeRate: string;
  signal: {
    compound: boolean;
    leverage: string;
    stopLoss: string;
    takeProfit: string;
  };
  symbol: string;
  webhook: { orderAmount: string };
}

// 進場預設偏多（超賣、黃金交叉、跌破下軌），出場預設相反
export const emptyCondition = (
  group: "entry" | "exit",
  kind: QuantIndicatorKind = "rsi",
): ConditionValues => ({
  band: group === "entry" ? "lower" : "upper",
  direction: group === "entry" ? "golden" : "death",
  fast: kind === "macdCross" ? "12" : "7",
  kind,
  operator: group === "entry" ? "below" : "above",
  period: kind === "bollinger" ? "20" : kind === "macdCross" ? "9" : "14",
  slow: kind === "macdCross" ? "26" : "25",
  stdDev: "2",
  value: group === "entry" ? "30" : "70",
});

export const defaultValues = (
  symbol: string,
  locale: AiConfig["locale"],
): BotFormValues => ({
  ai: {
    // Anthropic 對這個模型的預設 effort
    effort: "medium",
    guideline: "",
    interval: "15M",
    locale,
    maxOrderAmount: "",
    monthlyCostLimit: "",
    stopLoss: "",
    takeProfit: "",
  },
  credentialId: "",
  futures: { direction: "long", leverage: "" },
  dca: {
    baseOrderAmount: "",
    maxSafetyOrders: "",
    priceDeviation: "",
    safetyOrderAmount: "",
    stepScale: "1",
    stopLoss: "",
    takeProfit: "",
    volumeScale: "1",
  },
  grid: {
    bottom: "",
    closeModel: "NOT_SELL",
    gridType: "arithmetic",
    lossStop: "",
    lossStopType: "price",
    profitStop: "",
    profitStopType: "price",
    row: "",
    top: "",
    triggerDirection: "below",
    triggerPrice: "",
  },
  futuresGrid: {
    extraMargin: "",
    leverage: "",
    lossStopHigh: "",
    trend: "long",
  },
  indicator: {
    entry: [emptyCondition("entry")],
    exit: [],
    interval: "15M",
    orderAmount: "",
    stopLoss: "",
    takeProfit: "",
  },
  investment: "",
  maxDailyLoss: "",
  mode: "paper",
  name: "",
  paperFeeRate: "",
  signal: { compound: false, leverage: "", stopLoss: "", takeProfit: "" },
  symbol,
  webhook: { orderAmount: "" },
});

const text = (value?: number) => (value === undefined ? "" : String(value));

const gridValues = (
  base: BotFormValues["grid"],
  config: FuturesGridConfig | GridConfig,
): BotFormValues["grid"] => ({
  ...base,
  bottom: text(config.bottom),
  gridType: config.gridType,
  lossStop: text(config.lossStop?.value),
  lossStopType: config.lossStop?.type ?? "price",
  profitStop: text(config.profitStop?.value),
  profitStopType: config.profitStop?.type ?? "price",
  row: text(config.row),
  top: text(config.top),
  triggerDirection: config.trigger?.direction ?? "below",
  triggerPrice: text(config.trigger?.price),
});

const conditionValues =
  (group: "entry" | "exit") =>
  (condition: IndicatorCondition): ConditionValues => ({
    ...emptyCondition(group, condition.kind),
    ...(condition.band && { band: condition.band }),
    ...(condition.direction && { direction: condition.direction }),
    ...(condition.fast !== undefined && { fast: text(condition.fast) }),
    ...(condition.operator && { operator: condition.operator }),
    ...(condition.period !== undefined && { period: text(condition.period) }),
    ...(condition.slow !== undefined && { slow: text(condition.slow) }),
    ...(condition.stdDev !== undefined && { stdDev: text(condition.stdDev) }),
    ...(condition.value !== undefined && { value: text(condition.value) }),
  });

/** 「以此設定建立新機器人」：沿用來源機器人的設定，模式一律回到模擬盤讓使用者重新確認 */
export const valuesFromBot = (
  bot: QuantBot,
  locale: AiConfig["locale"],
): BotFormValues => {
  const base = defaultValues(bot.symbol, locale);
  const position = (bot.config as { futures?: FuturesPositionConfig }).futures;
  const values: BotFormValues = {
    ...base,
    futures: position
      ? { direction: position.direction, leverage: text(position.leverage) }
      : base.futures,
    investment: text(bot.investment),
    maxDailyLoss: text(bot.maxDailyLoss),
    name: bot.name,
    paperFeeRate:
      bot.paperFeeRate === undefined ? "" : text(bot.paperFeeRate * 100),
  };

  switch (bot.type) {
    case "grid": {
      const config = bot.config as GridConfig;
      values.grid = {
        ...gridValues(base.grid, config),
        closeModel: config.closeModel,
      };
      break;
    }
    case "futures_grid": {
      const config = bot.config as FuturesGridConfig;
      values.grid = gridValues(base.grid, config);
      values.futuresGrid = {
        extraMargin: text(config.extraMargin),
        leverage: text(config.leverage),
        lossStopHigh: text(config.lossStopHigh),
        trend: config.trend,
      };
      break;
    }
    case "dca": {
      const config = bot.config as DcaConfig;
      values.dca = {
        baseOrderAmount: text(config.baseOrderAmount),
        maxSafetyOrders: text(config.maxSafetyOrders),
        priceDeviation: text(config.priceDeviation),
        safetyOrderAmount: text(config.safetyOrderAmount),
        stepScale: text(config.stepScale),
        stopLoss: text(config.stopLoss),
        takeProfit: text(config.takeProfit),
        volumeScale: text(config.volumeScale),
      };
      break;
    }
    case "indicator": {
      const config = bot.config as IndicatorConfig;
      values.indicator = {
        entry: config.entry.map(conditionValues("entry")),
        exit: config.exit.map(conditionValues("exit")),
        interval: config.interval,
        orderAmount: text(config.orderAmount),
        stopLoss: text(config.stopLoss),
        takeProfit: text(config.takeProfit),
      };
      break;
    }
    case "webhook":
      values.webhook = {
        orderAmount: text((bot.config as WebhookConfig).orderAmount),
      };
      break;
    case "ai": {
      const config = bot.config as AiConfig;
      values.ai = {
        effort: config.effort,
        guideline: config.guideline ?? "",
        interval: config.interval,
        locale: config.locale,
        maxOrderAmount: text(config.maxOrderAmount),
        monthlyCostLimit: text(config.monthlyCostLimit),
        stopLoss: text(config.stopLoss),
        takeProfit: text(config.takeProfit),
      };
      break;
    }
    case "signal": {
      const config = bot.config as SignalBotConfig;
      values.mode = "live";
      values.signal = {
        compound: config.compound,
        leverage: text(config.leverage),
        stopLoss: text(config.stopLoss),
        takeProfit: text(config.takeProfit),
      };
    }
  }

  return values;
};

const optionalNumber = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

const toCondition = (condition: ConditionValues): IndicatorCondition => {
  switch (condition.kind) {
    case "rsi":
      return {
        kind: "rsi",
        operator: condition.operator,
        period: Number(condition.period),
        value: Number(condition.value),
      };
    case "maCross":
    case "emaCross":
      return {
        direction: condition.direction,
        fast: Number(condition.fast),
        kind: condition.kind,
        slow: Number(condition.slow),
      };
    case "macdCross":
      return {
        direction: condition.direction,
        fast: Number(condition.fast),
        kind: "macdCross",
        period: Number(condition.period),
        slow: Number(condition.slow),
      };
    case "bollinger":
      return {
        band: condition.band,
        kind: "bollinger",
        period: Number(condition.period),
        stdDev: Number(condition.stdDev),
      };
  }
};

const gridConfig = ({ grid }: BotFormValues) => {
  const stop = (stopType: "price" | "profit_amount", value: string) =>
    value.trim() === "" ? undefined : { type: stopType, value: Number(value) };

  return {
    bottom: Number(grid.bottom),
    gridType: grid.gridType,
    lossStop: stop(grid.lossStopType, grid.lossStop),
    profitStop: stop(grid.profitStopType, grid.profitStop),
    row: Number(grid.row),
    top: Number(grid.top),
    trigger:
      grid.triggerPrice.trim() === ""
        ? undefined
        : {
            direction: grid.triggerDirection,
            price: Number(grid.triggerPrice),
          },
  };
};

export const futuresGridConfig = (values: BotFormValues): FuturesGridConfig => {
  const { futuresGrid } = values;

  return {
    ...gridConfig(values),
    extraMargin: optionalNumber(futuresGrid.extraMargin),
    leverage: Number(futuresGrid.leverage),
    lossStopHigh:
      futuresGrid.trend === "no_trend"
        ? optionalNumber(futuresGrid.lossStopHigh)
        : undefined,
    trend: futuresGrid.trend,
  };
};

const futuresPosition = ({ futures, symbol }: BotFormValues) =>
  quantMarketTypeOf(symbol) === "PERP"
    ? { direction: futures.direction, leverage: Number(futures.leverage) }
    : undefined;

export const toConfig = (type: QuantBotType, values: BotFormValues) => {
  switch (type) {
    case "grid":
      return {
        ...gridConfig(values),
        closeModel: values.grid.closeModel,
      } satisfies GridConfig;
    case "futures_grid":
      return futuresGridConfig(values);
    case "dca": {
      const { dca } = values;

      return {
        baseOrderAmount: Number(dca.baseOrderAmount),
        maxSafetyOrders: Number(dca.maxSafetyOrders),
        priceDeviation: Number(dca.priceDeviation),
        safetyOrderAmount: Number(dca.safetyOrderAmount),
        stepScale: Number(dca.stepScale),
        stopLoss: optionalNumber(dca.stopLoss),
        futures: futuresPosition(values),
        takeProfit: Number(dca.takeProfit),
        volumeScale: Number(dca.volumeScale),
      } satisfies DcaConfig;
    }
    case "indicator": {
      const { indicator } = values;

      return {
        entry: indicator.entry.map(toCondition),
        exit: indicator.exit.map(toCondition),
        futures: futuresPosition(values),
        interval: indicator.interval,
        orderAmount: Number(indicator.orderAmount),
        stopLoss: optionalNumber(indicator.stopLoss),
        takeProfit: optionalNumber(indicator.takeProfit),
      } satisfies IndicatorConfig;
    }
    case "webhook":
      return {
        futures: futuresPosition(values),
        orderAmount: Number(values.webhook.orderAmount),
      } satisfies WebhookConfig;
    case "ai": {
      const { ai } = values;

      return {
        effort: ai.effort,
        futures: futuresPosition(values),
        guideline: ai.guideline.trim() || undefined,
        interval: ai.interval,
        locale: ai.locale,
        maxOrderAmount: Number(ai.maxOrderAmount),
        monthlyCostLimit: Number(ai.monthlyCostLimit),
        stopLoss: optionalNumber(ai.stopLoss),
        takeProfit: optionalNumber(ai.takeProfit),
      } satisfies AiConfig;
    }
    case "signal":
      return {
        compound: values.signal.compound,
        leverage: Number(values.signal.leverage),
        stopLoss: optionalNumber(values.signal.stopLoss),
        takeProfit: optionalNumber(values.signal.takeProfit),
      } satisfies SignalBotConfig;
  }
};

/** DCA 首單加上全部加碼最多需要的金額，和後端驗證同一個算法 */
export const dcaMaxInvestment = ({ dca }: BotFormValues) => {
  const base = Number(dca.baseOrderAmount);
  const safety = Number(dca.safetyOrderAmount);
  const count = Number(dca.maxSafetyOrders);
  const scale = Number(dca.volumeScale);
  if (![base, safety, count, scale].every(Number.isFinite)) return null;

  return Array.from(
    { length: count },
    (_, index) => safety * scale ** index,
  ).reduce((sum, value) => sum + value, base);
};

export const useBotFormSchema = (type: QuantBotType) => {
  const tValidation = useTranslations("quant.order.validation");

  const required = z
    .string()
    .trim()
    .min(1, { error: tValidation("required") });
  const positive = required.refine(
    (value) => Number.isFinite(Number(value)) && Number(value) > 0,
    { error: tValidation("positive") },
  );
  const optionalPositive = z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || (Number.isFinite(Number(value)) && Number(value) > 0),
      { error: tValidation("positive") },
    );
  const integer = (min: number, max: number) =>
    required.refine(
      (value) =>
        Number.isInteger(Number(value)) &&
        Number(value) >= min &&
        Number(value) <= max,
      { error: tValidation("range", { max, min }) },
    );
  const positiveInteger = required.refine(
    (value) => Number.isInteger(Number(value)) && Number(value) >= 1,
    { error: tValidation("positiveInteger") },
  );
  const condition = z.object({
    band: z.enum(["lower", "upper"]),
    direction: z.enum(["death", "golden"]),
    fast: integer(1, 500),
    kind: z.enum(["rsi", "maCross", "emaCross", "macdCross", "bollinger"]),
    operator: z.enum(["above", "below"]),
    period: integer(2, 500),
    slow: integer(2, 500),
    stdDev: positive,
    value: required,
  });

  const loose = z.any();

  return z
    .object({
      ai:
        type === "ai"
          ? z.object({
              effort: z.enum(["low", "medium", "high"]),
              guideline: z.string().max(2000),
              interval: z.string(),
              locale: z.string(),
              maxOrderAmount: positive,
              monthlyCostLimit: positive,
              stopLoss: optionalPositive,
              takeProfit: optionalPositive,
            })
          : loose,
      credentialId: z.string(),
      dca:
        type === "dca"
          ? z.object({
              baseOrderAmount: positive,
              maxSafetyOrders: integer(0, 50),
              priceDeviation: positive,
              safetyOrderAmount: positive,
              stepScale: positive,
              stopLoss: optionalPositive,
              takeProfit: positive,
              volumeScale: positive,
            })
          : loose,
      futures: z.object({
        direction: z.enum(["long", "short"]),
        leverage: z.string(),
      }),
      futuresGrid:
        type === "futures_grid"
          ? z.object({
              extraMargin: optionalPositive,
              leverage: positiveInteger,
              lossStopHigh: optionalPositive,
              trend: z.enum(["long", "short", "no_trend"]),
            })
          : loose,
      grid:
        type === "grid" || type === "futures_grid"
          ? z.object({
              bottom: positive,
              closeModel: z.enum(["NOT_SELL", "TO_QUOTE"]),
              gridType: z.enum(["arithmetic", "geometric"]),
              lossStop: optionalPositive,
              lossStopType: z.enum(["price", "profit_amount"]),
              profitStop: optionalPositive,
              profitStopType: z.enum(["price", "profit_amount"]),
              row: type === "grid" ? integer(2, 200) : integer(2, 500),
              top: positive,
              triggerDirection: z.enum(["above", "below"]),
              triggerPrice: optionalPositive,
            })
          : loose,
      indicator:
        type === "indicator"
          ? z.object({
              entry: z.array(condition).min(1),
              exit: z.array(condition),
              interval: z.string(),
              orderAmount: positive,
              stopLoss: optionalPositive,
              takeProfit: optionalPositive,
            })
          : loose,
      investment: positive,
      maxDailyLoss: optionalPositive,
      mode: z.enum(["paper", "live"]),
      name: required.max(50),
      paperFeeRate: z.string(),
      signal:
        type === "signal"
          ? z.object({
              compound: z.boolean(),
              leverage: positiveInteger,
              stopLoss: optionalPositive,
              takeProfit: optionalPositive,
            })
          : loose,
      symbol: required,
      webhook: type === "webhook" ? z.object({ orderAmount: positive }) : loose,
    })
    .superRefine((values, ctx) => {
      if (
        (type === "dca" ||
          type === "indicator" ||
          type === "webhook" ||
          type === "ai") &&
        quantMarketTypeOf(values.symbol) === "PERP"
      ) {
        const leverage = Number(values.futures.leverage);
        if (!Number.isInteger(leverage) || leverage < 1)
          ctx.addIssue({
            code: "custom",
            message: tValidation("positiveInteger"),
            path: ["futures", "leverage"],
          });
      }
      if (values.mode === "live" && !values.credentialId)
        ctx.addIssue({
          code: "custom",
          message: tValidation("required"),
          path: ["credentialId"],
        });
      if (values.mode === "paper" && type !== "signal") {
        const fee = Number(values.paperFeeRate);
        if (
          values.paperFeeRate.trim() === "" ||
          !Number.isFinite(fee) ||
          fee < 0 ||
          fee > 1
        )
          ctx.addIssue({
            code: "custom",
            message: tValidation("required"),
            path: ["paperFeeRate"],
          });
      }
      if (
        (type === "grid" || type === "futures_grid") &&
        Number(values.grid.top) <= Number(values.grid.bottom)
      )
        ctx.addIssue({
          code: "custom",
          message: tValidation("topAboveBottom"),
          path: ["grid", "top"],
        });
      if (
        type === "futures_grid" &&
        values.futuresGrid.trend === "no_trend" &&
        values.grid.profitStop.trim() !== "" &&
        values.grid.profitStopType === "price"
      )
        ctx.addIssue({
          code: "custom",
          message: tValidation("neutralProfitStop"),
          path: ["grid", "profitStop"],
        });
    });
};
