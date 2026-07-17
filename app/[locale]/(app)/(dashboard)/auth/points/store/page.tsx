import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import Store from ".";

import { routing } from "@/i18n/routing";

import type { MyPoints } from "@/types/points";

import { fetcher } from "@/utils/fetcher";

const AuthPointsStorePage = async ({
  params,
}: PageProps<"/[locale]/auth/points/store">) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const reqHeaders = await headers();
  const cookie = reqHeaders.get("cookie") || "";
  const points = await fetcher<MyPoints>("/api/users/me/points", {
    headers: { cookie },
  }).catch(() => null);

  return <Store points={points} />;
};

export default AuthPointsStorePage;
