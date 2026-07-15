import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Orders from ".";
import { getOrdersKey } from "./constants";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import type { UserOrderListResponse } from "@/types/orders";

import { fetcher } from "@/utils/fetcher";

const AuthOrdersPage = async ({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/orders">) => {
  const [{ locale }, { page: rawPage, pageSize: rawPageSize }] =
    await Promise.all([params, searchParams]);
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  if (rawPage !== String(page) || rawPageSize !== String(pageSize)) {
    redirect({
      href: `/auth/orders?${new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })}`,
      locale,
    });
  }

  const reqHeaders = await headers();
  const orders = await fetcher<UserOrderListResponse>(
    getOrdersKey(page, pageSize),
    {
      headers: { cookie: reqHeaders.get("cookie") || "" },
    },
  ).catch(() => null);

  return <Orders orders={orders} page={page} pageSize={pageSize} />;
};

export default AuthOrdersPage;
