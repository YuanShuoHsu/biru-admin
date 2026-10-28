import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PointSettings from ".";

import type { Locale } from "@/i18n/routing";

import { getPointSetting } from "@/utils/points";
import { getSession } from "@/utils/session";

interface PointSettingsPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: PointSettingsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tPointSettings = await getTranslations({
    locale,
    namespace: "pointSettings",
  });

  return { title: tPointSettings("label") };
};

const PointSettingsPage = async () => {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

  if (session?.user?.role !== "admin") notFound();

  const pointSetting = await getPointSetting({
    headers: { cookie: cookieStore.toString() },
  });

  return <PointSettings pointSetting={pointSetting} />;
};

export default PointSettingsPage;
