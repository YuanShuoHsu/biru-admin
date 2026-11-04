import { cookies } from "next/headers";

import { DEFAULT_PAGINATION_QUERY } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
import { getQuantBot } from "@/utils/quant";

interface QuantBotPageProps {
  params: Promise<{ botId: string; locale: Locale }>;
}

const QuantBotPage = async ({ params }: QuantBotPageProps) => {
  const [cookieStore, { botId, locale }] = await Promise.all([
    cookies(),
    params,
  ]);

  const { data: bot } = await settle(
    getQuantBot(botId, { headers: { cookie: cookieStore.toString() } }),
  );

  if (bot && bot.executor !== "pionex")
    redirect({
      href: `/quant/bots/${botId}/orders?${new URLSearchParams(DEFAULT_PAGINATION_QUERY).toString()}`,
      locale,
    });

  return null;
};

export default QuantBotPage;
