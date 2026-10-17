import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BotForm from "./BotForm";

import type { Locale } from "@/i18n/routing";

import { quantBotTypeValues } from "@/types/api";
import type { QuantBotType } from "@/types/quant";

interface NewQuantBotPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ from?: string; type?: string }>;
}

export const generateMetadata = async ({
  params,
}: NewQuantBotPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tBots = await getTranslations({ locale, namespace: "quant.bots" });

  return { title: tBots("new.label") };
};

const isBotType = (value?: string): value is QuantBotType =>
  quantBotTypeValues.some((type) => type === value);

const NewQuantBotPage = async ({ searchParams }: NewQuantBotPageProps) => {
  const { from, type } = await searchParams;

  return <BotForm fromId={from} type={isBotType(type) ? type : "grid"} />;
};

export default NewQuantBotPage;
