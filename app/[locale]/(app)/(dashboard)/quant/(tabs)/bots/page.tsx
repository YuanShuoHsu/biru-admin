import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BotList from "./BotList";

import type { Locale } from "@/i18n/routing";

interface QuantBotsPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: QuantBotsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tBots = await getTranslations({ locale, namespace: "quant.bots" });

  return { title: tBots("label") };
};

const QuantBotsPage = () => <BotList />;

export default QuantBotsPage;
