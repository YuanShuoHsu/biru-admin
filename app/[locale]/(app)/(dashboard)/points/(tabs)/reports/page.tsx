import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PointReports from ".";
import { resolvePointReportMonth } from "./definitions";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
import { getPointReport } from "@/utils/points";
import { getSession } from "@/utils/session";

interface PointReportsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ month?: string }>;
}

export const generateMetadata = async ({
  params,
}: PointReportsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tPointReports = await getTranslations({
    locale,
    namespace: "pointReports",
  });

  return { title: tPointReports("label") };
};

const PointReportsPage = async ({
  params,
  searchParams,
}: PointReportsPageProps) => {
  const [session, cookieStore, { locale }, { month: rawMonth }] =
    await Promise.all([getSession(), cookies(), params, searchParams]);

  if (session?.user?.role !== "admin") notFound();

  const month = resolvePointReportMonth(rawMonth);

  const { data, error } = await settle(
    getPointReport(month, {
      headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
    }),
  );

  if (error) return <ErrorAlert />;

  return <PointReports report={data} />;
};

export default PointReportsPage;
