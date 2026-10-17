"use client";

import type { BaseSyntheticEvent } from "react";

import { useTranslations } from "next-intl";
import { enqueueSnackbar } from "notistack";
import { useForm, useWatch } from "react-hook-form";
import useSWR, { useSWRConfig } from "swr";

import { useQuantCredentials } from "../../../useQuantCredentials";
import { QUANT_BOTS_URL, isQuantBotKey } from "../../useQuantBots";
import WebhookSetup from "../../WebhookSetup";
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

import FuturesGridFields from "./FuturesGridFields";

import FormBox from "@/components/FormBox";

import { DEFAULT_QUANT_SYMBOLS, quantPairOf } from "@/constants/quant";

import { zodResolver } from "@hookform/resolvers/zod";

import { Link, useRouter } from "@/i18n/navigation";

import {
  Alert,
  Autocomplete,
  Button,
  Grid,
  Link as MuiLink,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useDialogStore } from "@/providers/dialog-store-provider";

import type {
  CreateQuantBotResponse,
  QuantBot,
  QuantBotMode,
  QuantBotType,
  QuantMarket,
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

const Section = styled(Paper)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
}));

const BacktestSection = styled(Section)(({ theme }) => ({
  [theme.breakpoints.up("lg")]: {
    flexShrink: 0,
    position: "sticky",
    top: theme.spacing(2),
    width: 420,
  },
}));

const BOT_FORM_ID = "quant-bot-form";
const PIONEX_FEES_URL = "https://www.pionex.com/en/fees";

interface BotFormFieldsProps {
  initialValues: BotFormValues;
  type: QuantBotType;
}

const BotFormFields = ({ initialValues, type }: BotFormFieldsProps) => {
  const tBots = useTranslations("quant.bots");
  const tForm = useTranslations("quant.bots.form");
  const tQuant = useTranslations("quant");
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const setDialog = useDialogStore((state) => state.setDialog);

  const isFutures = type === "futures_grid";
  const { credentials } = useQuantCredentials();
  const { data: markets } = useSWR<QuantMarket[]>(
    `/api/quant/markets?type=${isFutures ? "PERP" : "SPOT"}`,
    fetcher,
  );

  const schema = useBotFormSchema(type);
  const form: BotForm = useForm<BotFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(schema),
  });
  const {
    control,
    formState: { errors, isSubmitted, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = form;

  const [symbol, mode, credentialId] = useWatch({
    control,
    name: ["symbol", "mode", "credentialId"],
  });
  const market = markets?.find((item) => item.symbol === symbol);
  const quote = market?.quoteCurrency ?? "";
  const isLiveGrid = mode === "live" && type === "grid";
  const isLiveFuturesGrid = mode === "live" && isFutures;

  const onSubmitHandler = async (values: BotFormValues) => {
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
            mode: values.mode,
            name: values.name,
            paperFeeRate:
              values.mode === "paper"
                ? Number(values.paperFeeRate) / 100
                : undefined,
            symbol: values.symbol,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      enqueueSnackbar(tBots("new.success"), { variant: "success" });
      void mutate(isQuantBotKey);
      router.push(`/quant/bots/${created.id}`);

      if (created.webhookToken)
        setDialog({
          content: (
            <WebhookSetup botId={created.id} token={created.webhookToken} />
          ),
          open: true,
          showCancel: false,
          title: tBots("webhook.title"),
        });
    } catch (error) {
      enqueueSnackbar(getErrorMessage(error), { variant: "error" });
    }
  };

  const onSubmit = (event: BaseSyntheticEvent) =>
    handleSubmit(onSubmitHandler)(event);

  const setOptions = { shouldValidate: isSubmitted };

  return (
    <Stack sx={{ gap: 2 }}>
      <Stack>
        <Typography variant="h5">
          {tBots("new.title", { type: tBots(`types.${type}`) })}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {tBots(`typeDescriptions.${type}`)}
        </Typography>
      </Stack>
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
              <Grid size={{ sm: 6, xs: 12 }}>
                <TextField
                  {...register("name")}
                  error={!!errors.name}
                  fullWidth
                  helperText={errors.name?.message}
                  label={tForm("name")}
                  required
                  size="small"
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
                      size="small"
                    />
                  )}
                  value={symbol}
                />
              </Grid>
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
                  <ToggleButton color="warning" value="live">
                    {tBots("modes.live")}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
              {mode === "live" &&
                (credentials?.length ? (
                  <Grid size={12}>
                    <SelectField
                      form={form}
                      label={tForm("credential")}
                      name="credentialId"
                      options={credentials.map(
                        ({ apiKeyLast4, id, label }) => ({
                          label: `${label} (…${apiKeyLast4})`,
                          value: id,
                        }),
                      )}
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
                    {tForm(isFutures ? "liveFuturesGridNote" : "liveGridNote")}
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
              <Grid size={{ sm: 6, xs: 12 }}>
                <NumberField
                  adornment="%"
                  form={form}
                  helperText={tForm.rich("paperFeeRateHelper", {
                    link: (chunks) => (
                      <MuiLink
                        href={PIONEX_FEES_URL}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {chunks}
                      </MuiLink>
                    ),
                  })}
                  label={tForm("paperFeeRate")}
                  name="paperFeeRate"
                  required={mode === "paper"}
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
            </Grid>
          </Section>
          <Section>
            <Typography variant="h6">{tForm("strategy")}</Typography>
            {type === "grid" && (
              <GridFields
                aiCredentialId={credentialId || credentials?.[0]?.id}
                form={form}
                market={market}
              />
            )}
            {isFutures && (
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
          <Button
            loading={isSubmitting}
            size="large"
            sx={{ alignSelf: "flex-start" }}
            type="submit"
            variant="contained"
          >
            {tBots("new.submit")}
          </Button>
        </FormBox>
        {type !== "webhook" && (
          <BacktestSection>
            <BacktestPanel form={form} market={market} type={type} />
          </BacktestSection>
        )}
      </Layout>
    </Stack>
  );
};

interface BotFormProps {
  fromId?: string;
  type: QuantBotType;
}

const BotForm = ({ fromId, type }: BotFormProps) => {
  const { data: source, error } = useSWR<QuantBot>(
    fromId ? `${QUANT_BOTS_URL}/${fromId}` : null,
    fetcher,
  );

  if (fromId && !source && !error)
    return <Skeleton height={480} variant="rounded" />;

  return source ? (
    <BotFormFields
      initialValues={valuesFromBot(source)}
      key={source.id}
      type={source.type}
    />
  ) : (
    <BotFormFields
      initialValues={defaultValues(
        DEFAULT_QUANT_SYMBOLS[type === "futures_grid" ? "PERP" : "SPOT"],
      )}
      type={type}
    />
  );
};

export default BotForm;
