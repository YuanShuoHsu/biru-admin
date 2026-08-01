import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Points from ".";
import { getPointsKey } from "./constants";

import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import type { MyPoints } from "@/types/points";

import { fetcher } from "@/utils/fetcher";

export const generateMetadata = async ({
  params,
}: PageProps<"/[locale]/auth/points/transactions">): Promise<Metadata> => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale });

  return { title: t("auth.points.transactions.label") };
};

const AuthPointsPage = async ({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/points/transactions">) => {
  const [{ locale }, { page: rawPage, pageSize: rawPageSize }] =
    await Promise.all([params, searchParams]);
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE);

  if (rawPage !== String(page) || rawPageSize !== String(pageSize)) {
    redirect({
      href: `/auth/points/transactions?${new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })}`,
      locale,
    });
  }

  const reqHeaders = await headers();
  const points = await fetcher<MyPoints>(getPointsKey(page, pageSize), {
    headers: { cookie: reqHeaders.get("cookie") || "" },
  }).catch(() => null);

  return <Points page={page} pageSize={pageSize} points={points} />;
};

export default AuthPointsPage;
