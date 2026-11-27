import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PointReportDetail from ".";
import { resolvePointReportMonth } from "../definitions";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { isMissingResource, settle } from "@/utils/fetcher";
import { getPointReportDetail } from "@/utils/points";
import { getSession } from "@/utils/session";

interface PointReportDetailPageProps {
  params: Promise<{ locale: Locale; organizationId: string }>;
  searchParams: Promise<{ month?: string }>;
}

export const generateMetadata = async ({
  params,
}: PointReportDetailPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tPointReports = await getTranslations({
    locale,
    namespace: "pointReports",
  });

  return { title: tPointReports("detail.label") };
};

const PointReportDetailPage = async ({
  params,
  searchParams,
}: PointReportDetailPageProps) => {
  const [
    session,
    cookieStore,
    { locale, organizationId },
    { month: rawMonth },
  ] = await Promise.all([getSession(), cookies(), params, searchParams]);

  if (session?.user?.role !== "admin") notFound();

  const month = resolvePointReportMonth(rawMonth);

  const { data, error } = await settle(
    getPointReportDetail(organizationId, month, {
      headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
    }),
  );

  if (isMissingResource(error)) notFound();
  if (error) return <ErrorAlert />;

  return <PointReportDetail detail={data} />;
};

export default PointReportDetailPage;
