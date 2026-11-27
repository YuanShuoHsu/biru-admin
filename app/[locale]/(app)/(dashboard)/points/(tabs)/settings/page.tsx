import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PointSettings from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
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

  const { data, error } = await settle(
    getPointSetting({ headers: { cookie: cookieStore.toString() } }),
  );

  if (error) return <ErrorAlert />;
  if (!data) notFound();

  return <PointSettings pointSetting={data} />;
};

export default PointSettingsPage;
