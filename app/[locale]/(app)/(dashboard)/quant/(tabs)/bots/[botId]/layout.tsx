import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import BotDetail from "./BotDetail";

import type { Locale } from "@/i18n/routing";

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const tBots = await getTranslations({ locale, namespace: "quant.bots" });

  return { title: tBots("label") };
};

const QuantBotLayout = async ({
  children,
  params,
}: LayoutProps<"/[locale]/quant/bots/[botId]">) => {
  const { botId } = await params;

  return <BotDetail botId={botId}>{children}</BotDetail>;
};

export default QuantBotLayout;
