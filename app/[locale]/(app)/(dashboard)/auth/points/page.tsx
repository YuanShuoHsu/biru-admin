import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Points from ".";
import { getPointsKey } from "./constants";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import type { MyPointsWallet } from "@/types/points";

import { fetcher } from "@/utils/fetcher";

const AuthPointsPage = async ({
  params,
  searchParams,
}: PageProps<"/[locale]/auth/points">) => {
  const [{ locale }, { page: rawPage, pageSize: rawPageSize }] =
    await Promise.all([params, searchParams]);
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || 10);

  if (rawPage !== String(page) || rawPageSize !== String(pageSize)) {
    redirect({
      href: `/auth/points?${new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })}`,
      locale,
    });
  }

  const reqHeaders = await headers();
  const wallets = await fetcher<MyPointsWallet[]>(getPointsKey(page, pageSize), {
    headers: { cookie: reqHeaders.get("cookie") || "" },
  }).catch(() => []);

  return <Points page={page} pageSize={pageSize} wallets={wallets} />;
};

export default AuthPointsPage;
