import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Orders from ".";
import { getOrdersKey } from "./constants";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import type { UserOrderListResponse } from "@/types/orders";

import { fetcher } from "@/utils/fetcher";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/auth/orders">): Promise<Metadata> => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale });

  return { title: t("auth.orders.label") };
};

const AuthOrdersPage = async ({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/orders">) => {
  const [{ locale }, { page: rawPage, pageSize: rawPageSize }] =
    await Promise.all([params, searchParams]);
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.min(
    Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );

  if (
    (rawPage !== undefined && rawPage !== String(page)) ||
    (rawPageSize !== undefined && rawPageSize !== String(pageSize))
  ) {
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
