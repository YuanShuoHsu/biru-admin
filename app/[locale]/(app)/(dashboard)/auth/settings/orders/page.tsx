import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Orders from ".";
import { getOrdersKey } from "./constants";

import { routing } from "@/i18n/routing";

import type { UserOrderListResponse } from "@/types/orders";

import { fetcher } from "@/utils/fetcher";

const AuthSettingsOrdersPage = async ({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/settings/orders">) => {
  const [{ locale }, { page: rawPage }] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);

  const reqHeaders = await headers();
  const orders = await fetcher<UserOrderListResponse>(getOrdersKey(page), {
    headers: { cookie: reqHeaders.get("cookie") || "" },
  }).catch(() => null);

  return <Orders orders={orders} page={page} />;
};

export default AuthSettingsOrdersPage;
