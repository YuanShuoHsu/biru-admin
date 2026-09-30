import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import MyWithholding from ".";

import AttendanceTabsLayout from "../../AttendanceTabsLayout";

import type { Locale } from "@/i18n/routing";

import {
  getAttendanceAccess,
  getMyWithholdingCertificates,
} from "@/utils/attendance";

interface MyWithholdingPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: MyWithholdingPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("withholding.mine") };
};

const MyWithholdingPage = async ({
  params,
  searchParams,
}: MyWithholdingPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const access = await getAttendanceAccess(
    rawSearchParams.organization,
    cookieStore.toString(),
  );

  if (!access) notFound();

  const { memberRole, organization } = access;

  const certificates = await getMyWithholdingCertificates(organization.slug, {
    headers: { cookie: cookieStore.toString() },
  });

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <MyWithholding certificates={certificates} organization={organization} />
    </AttendanceTabsLayout>
  );
};

export default MyWithholdingPage;
