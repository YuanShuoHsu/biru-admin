"use client";

import { type BaseSyntheticEvent, useCallback, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";
import useSWR, { useSWRConfig } from "swr";

import { useQuantCredentials } from "../../useQuantCredentials";
import { QUANT_BOTS_URL, isQuantBotKey } from "../useQuantBots";
import WebhookSetup from "../WebhookSetup";
import AiBacktestPanel from "./AiBacktestPanel";
import AiFields from "./AiFields";
import BacktestPanel from "./BacktestPanel";
import DcaFields from "./DcaFields";
import {
  type BotFormValues,
  defaultValues,
  toConfig,
  useBotFormSchema,
  valuesFromBot,
} from "./definitions";
import { type BotForm, NumberField, SelectField } from "./fields";
import GridFields from "./GridFields";
import IndicatorFields from "./IndicatorFields";
import FuturesPositionFields from "./FuturesPositionFields";
import SignalFields from "./SignalFields";

import FuturesGridFields from "./FuturesGridFields";

import FormBox from "@/components/FormBox";

import {
  DEFAULT_QUANT_SYMBOLS,
  quantMarketTypeOf,
  quantPairOf,
} from "@/constants/quant";

import { zodResolver } from "@hookform/resolvers/zod";

import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  Alert,
  Autocomplete,
  Button,
  Grid,
  ListSubheader,
  MenuItem,
  Paper,
  type PaperProps,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import { quantBotTypeValues, quantMarketTypeValues } from "@/types/api";
import type {
  CreateQuantBotResponse,
  QuantBot,
  QuantBotMode,
  QuantBotType,
  QuantMarket,
  QuantMarketType,
} from "@/types/quant";

import { getErrorMessage } from "@/utils/errors";
import { fetcher } from "@/utils/fetcher";

const Layout = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  [theme.breakpoints.up("lg")]: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
}));

const Section = styled((props: PaperProps) => (
  <Paper variant="outlined" {...props} />
))(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
}));

const BacktestSection = styled(Section)(({ theme }) => ({
  [theme.breakpoints.up("lg")]: { flexShrink: 0, width: 400 },
}));

const BOT_FORM_ID = "quant-bot-form";

// 實盤交給 Pionex 官方機器人執行；模擬盤一樣由本系統模擬
const PIONEX_BOT_TYPES: readonly QuantBotType[] = [
  "grid",
  "futures_grid",
  "signal",
];
const BOT_TYPE_GROUPS = [
  {
    group: "pionex",
    types: quantBotTypeValues.filter((value) =>
      PIONEX_BOT_TYPES.includes(value),
    ),
  },
  {
    group: "engine",
    types: quantBotTypeValues.filter(
      (value) => !PIONEX_BOT_TYPES.includes(value),
    ),
  },
] as const;

interface BotFormFieldsProps {
  initialValues: BotFormValues;
  onTypeChange?: (type: QuantBotType) => void;
  type: QuantBotType;
}

const BotFormFields = ({
  initialValues,
  onTypeChange,
  type,
}: BotFormFieldsProps) => {
  const tBots = useTranslations("quant.bots");
  const tForm = useTranslations("quant.bots.form");
  const tQuant = useTranslations("quant");
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { closeDialog, setDialog } = useDialogStore((state) => state);

  const isSignal = type === "signal";
  const isFutures = type === "futures_grid" || isSignal;
  const canChooseMarket =
    type === "dca" ||
    type === "indicator" ||
    type === "webhook" ||
    type === "ai";
  const { credentials } = useQuantCredentials();

  const schema = useBotFormSchema(type);
  const form: BotForm = useForm<BotFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });
  const {
    control,
    formState: { errors, isSubmitted },
    handleSubmit,
    register,
    setValue,
  } = form;

  const [symbol, mode, credentialId] = useWatch({
    control,
    name: ["symbol", "mode", "credentialId"],
  });
  const marketType: QuantMarketType = isFutures
    ? "PERP"
    : canChooseMarket
      ? quantMarketTypeOf(symbol)
      : "SPOT";
  const isFuturesStrategy = canChooseMarket && marketType === "PERP";
  const { data: markets } = useSWR<QuantMarket[]>(
    `/api/quant/markets?type=${marketType}`,
    fetcher,
  );
  const market = markets?.find((item) => item.symbol === symbol);
  const quote = market?.quoteCurrency ?? "";
  const isLiveGrid = mode === "live" && type === "grid";
  const isLiveFuturesGrid = mode === "live" && type === "futures_grid";
  const hasOrderLimit =
    type === "dca" || type === "indicator" || type === "webhook";

  const onSubmitHandler = async (values: BotFormValues) => {
    setDialog({ confirmLoading: true });
    try {
      const created = await fetcher<CreateQuantBotResponse>(
        `${QUANT_BOTS_URL}/${type}`,
        {
          body: JSON.stringify({
            config: toConfig(type, values),
            credentialId:
              values.mode === "live" ? values.credentialId : undefined,
            investment: Number(values.investment),
            maxDailyLoss:
              isLiveGrid || values.maxDailyLoss.trim() === ""
                ? undefined
                : Number(values.maxDailyLoss),
            maxOrderAmount:
              !hasOrderLimit || values.maxOrderAmount.trim() === ""
                ? undefined
                : Number(values.maxOrderAmount),
            mode: values.mode,
            name: values.name,
            symbol: values.symbol,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      enqueueSnackbar(tBots("new.success"), { variant: "success" });
      void mutate(isQuantBotKey);
      router.push(`/quant/bots/${created.id}`);

      // token 只回傳這一次，直接在同一個對話框換成 Webhook 設定；先關再開會被關閉動畫的重設清掉
      if (created.webhookToken)
        setDialog({
          confirmLoading: false,
          confirmText: "",
          content: (
            <WebhookSetup botId={created.id} token={created.webhookToken} />
          ),
          formId: undefined,
          maxWidth: undefined,
          showCancel: false,
          title: tBots("webhook.title"),
        });
      else closeDialog();
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
      setDialog({ confirmLoading: false });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  const setOptions = { shouldValidate: isSubmitted };

  return (
    <Layout>
      <FormBox
        id={BOT_FORM_ID}
        noValidate
        onSubmit={onSubmit}
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Section>
          <Typography variant="h6">{tForm("basic")}</Typography>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                disabled={!onTypeChange}
                fullWidth
                helperText={tBots(`typeDescriptions.${type}`)}
                label={tBots("columns.type")}
                onChange={(event) =>
                  onTypeChange?.(event.target.value as QuantBotType)
                }
                required
                select
                value={type}
              >
                {BOT_TYPE_GROUPS.flatMap(({ group, types }) => [
                  <ListSubheader key={group}>
                    {tForm(`typeGroups.${group}`)}
                  </ListSubheader>,
                  ...types.map((value) => (
                    <MenuItem key={value} value={value}>
                      {tBots(`types.${value}`)}
                    </MenuItem>
                  )),
                ])}
              </TextField>
            </Grid>
            <Grid size={{ sm: 6, xs: 12 }}>
              <TextField
                {...register("name")}
                error={!!errors.name}
                fullWidth
                helperText={errors.name?.message}
                label={tForm("name")}
                required
              />
            </Grid>
            <Grid size={{ sm: 6, xs: 12 }}>
              <Autocomplete
                disableClearable
                getOptionLabel={quantPairOf}
                onChange={(_, value) => setValue("symbol", value, setOptions)}
                options={(markets ?? [])
                  .toSorted((a, b) => b.quoteVolume - a.quoteVolume)
                  .map((item) => item.symbol)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={!!errors.symbol}
                    helperText={errors.symbol?.message}
                    label={tForm("symbol")}
                    required
                  />
                )}
                value={symbol}
              />
            </Grid>
            {canChooseMarket && (
              <Grid size={12}>
                <ToggleButtonGroup
                  aria-label={tQuant("market.marketType")}
                  exclusive
                  onChange={(_, value: QuantMarketType | null) => {
                    if (!value) return;
                    setValue(
                      "symbol",
                      DEFAULT_QUANT_SYMBOLS[value],
                      setOptions,
                    );
                    if (value === "PERP") setValue("mode", "paper", setOptions);
                  }}
                  size="small"
                  value={marketType}
                >
                  {quantMarketTypeValues.map((value) => (
                    <ToggleButton key={value} value={value}>
                      {tQuant(`market.types.${value}`)}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>
            )}
            {!isSignal && (
              <Grid size={12}>
                <ToggleButtonGroup
                  aria-label={tForm("mode")}
                  exclusive
                  onChange={(_, value: QuantBotMode | null) =>
                    value && setValue("mode", value, setOptions)
                  }
                  size="small"
                  value={mode}
                >
                  <ToggleButton value="paper">
                    {tBots("modes.paper")}
                  </ToggleButton>
                  <ToggleButton
                    color="warning"
                    disabled={isFuturesStrategy}
                    value="live"
                  >
                    {tBots("modes.live")}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            )}
            {isFuturesStrategy && (
              <Grid size={12}>
                <Alert severity="info">
                  {tForm(
                    type === "ai"
                      ? "futuresAiLivePending"
                      : "futuresStrategyPaperOnly",
                  )}
                </Alert>
              </Grid>
            )}
            {mode === "live" &&
              (credentials?.length ? (
                <Grid size={12}>
                  <SelectField
                    form={form}
                    label={tForm("credential")}
                    name="credentialId"
                    options={credentials.map(({ apiKeyLast4, id, label }) => ({
                      label: `${label} (…${apiKeyLast4})`,
                      value: id,
                    }))}
                    required
                  />
                </Grid>
              ) : (
                <Grid size={12}>
                  <Alert
                    action={
                      <Button
                        component={Link}
                        href="/quant/settings"
                        onClick={closeDialog}
                        size="small"
                      >
                        {tQuant("account.goToSettings")}
                      </Button>
                    }
                    severity="info"
                  >
                    {tQuant("account.noCredential")}
                  </Alert>
                </Grid>
              ))}
            {(isLiveGrid || isLiveFuturesGrid) && (
              <Grid size={12}>
                <Alert severity="info">
                  {tForm(
                    isLiveFuturesGrid ? "liveFuturesGridNote" : "liveGridNote",
                  )}
                </Alert>
              </Grid>
            )}
            <Grid size={{ sm: 6, xs: 12 }}>
              <NumberField
                adornment={quote}
                form={form}
                helperText={tForm("investmentHelper")}
                label={tForm("investment")}
                name="investment"
                required
              />
            </Grid>
            {!isLiveGrid && (
              <Grid size={{ sm: 6, xs: 12 }}>
                <NumberField
                  adornment={quote}
                  form={form}
                  helperText={tForm("maxDailyLossHelper")}
                  label={tForm("maxDailyLoss")}
                  name="maxDailyLoss"
                />
              </Grid>
            )}
            {hasOrderLimit && (
              <Grid size={{ sm: 6, xs: 12 }}>
                <NumberField
                  adornment={quote}
                  form={form}
                  helperText={tForm("maxOrderAmountHelper")}
                  label={tForm("maxOrderAmount")}
                  name="maxOrderAmount"
                />
              </Grid>
            )}
          </Grid>
        </Section>
        <Section>
          <Typography variant="h6">{tForm("strategy")}</Typography>
          {type === "grid" && (
            <GridFields
              credentialId={credentialId || credentials?.[0]?.id}
              form={form}
              market={market}
            />
          )}
          {isSignal && <SignalFields form={form} market={market} />}
          {type === "ai" && <AiFields form={form} quote={quote} />}
          {isFuturesStrategy && (
            <FuturesPositionFields form={form} market={market} />
          )}
          {type === "futures_grid" && (
            <FuturesGridFields
              checkCredentialId={credentialId || credentials?.[0]?.id}
              form={form}
              lastPrice={market?.close}
              market={market}
            />
          )}
          {type === "dca" && <DcaFields form={form} quote={quote} />}
          {type === "indicator" && (
            <IndicatorFields form={form} quote={quote} />
          )}
          {type === "webhook" && (
            <NumberField
              adornment={quote}
              form={form}
              label={tForm("webhook.orderAmount")}
              name="webhook.orderAmount"
              required
            />
          )}
        </Section>
      </FormBox>
      {type === "ai" && (
        <BacktestSection>
          <AiBacktestPanel form={form} market={market} />
        </BacktestSection>
      )}
      {type !== "webhook" && type !== "signal" && type !== "ai" && (
        <BacktestSection>
          <BacktestPanel form={form} market={market} type={type} />
        </BacktestSection>
      )}
    </Layout>
  );
};

interface BotFormProps {
  fromId?: string;
}

const newBotValues = (type: QuantBotType, locale: Locale): BotFormValues => ({
  ...defaultValues(
    DEFAULT_QUANT_SYMBOLS[
      type === "futures_grid" || type === "signal" ? "PERP" : "SPOT"
    ],
    locale,
  ),
  mode: type === "signal" ? "live" : "paper",
});

const BotForm = ({ fromId }: BotFormProps) => {
  const locale = useLocale();
  const [type, setType] = useState<QuantBotType>(quantBotTypeValues[0]);
  const { data: source, error } = useSWR<QuantBot>(
    fromId ? `${QUANT_BOTS_URL}/${fromId}` : null,
    fetcher,
  );

  if (fromId && !source && !error)
    return <Skeleton height={480} variant="rounded" />;

  return source ? (
    <BotFormFields
      initialValues={valuesFromBot(source, locale)}
      key={source.id}
      type={source.type}
    />
  ) : (
    <BotFormFields
      initialValues={newBotValues(type, locale)}
      key={type}
      onTypeChange={setType}
      type={type}
    />
  );
};

export default BotForm;

/** 建立、複製都在同一個大對話框裡填，填完導到新機器人的詳情頁 */
export const useBotFormDialog = () => {
  const tBots = useTranslations("quant.bots");
  const setDialog = useDialogStore((state) => state.setDialog);

  return useCallback(
    (props: BotFormProps) =>
      setDialog({
        confirmText: tBots("new.submit"),
        content: <BotForm {...props} />,
        formId: BOT_FORM_ID,
        maxWidth: "lg",
        open: true,
        title: tBots("new.label"),
      }),
    [setDialog, tBots],
  );
};
