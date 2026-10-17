import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BotDetail from "./BotDetail";

import type { Locale } from "@/i18n/routing";

interface QuantBotPageProps {
  params: Promise<{ botId: string; locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: QuantBotPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tBots = await getTranslations({ locale, namespace: "quant.bots" });

  return { title: tBots("label") };
};

const QuantBotPage = async ({ params }: QuantBotPageProps) => {
  const { botId } = await params;

  return <BotDetail botId={botId} />;
};

export default QuantBotPage;
