import dayjs from "dayjs";
import timezonePlugin from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Withholding from ".";

import { STORE_TIMEZONE } from "@/constants/timezone";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { getPayrollWithholdingSummary } from "@/utils/attendance";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const FILING_DEADLINE_MONTH_INDEX = 0;

interface WithholdingPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string; year?: string }>;
}

export const generateMetadata = async ({
  params,
}: WithholdingPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("withholding.label") };
};

const WithholdingContent = async ({
  params,
  searchParams,
}: WithholdingPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const access = await getAttendanceAccess(rawSearchParams.organization);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (rawSearchParams.organization !== organization.slug) {
    const params = new URLSearchParams({
      organization: organization.slug,
      ...(rawSearchParams.year && { year: rawSearchParams.year }),
    });

    redirect({
      href: `/attendance/payroll/withholding?${params.toString()}`,
      locale,
    });
  }

  if (
    !hasRolePermission(memberRole, { payrollTerm: ["read"], payslip: ["read"] })
  )
    notFound();

  const now = dayjs().tz(STORE_TIMEZONE);
  const requestedYear = Number(rawSearchParams.year);
  const year =
    Number.isInteger(requestedYear) && requestedYear >= 2000
      ? requestedYear
      : now.month() <= FILING_DEADLINE_MONTH_INDEX
        ? now.year() - 1
        : now.year();

  const summary = await getPayrollWithholdingSummary(
    organization.slug,
    year,
    fetchOptions,
  );

  return (
    <Withholding
      canManage={hasRolePermission(memberRole, { payrollTerm: ["update"] })}
      organization={organization}
      summary={summary}
    />
  );
};

const WithholdingPage = (props: WithholdingPageProps) => (
  <Suspense fallback={<Withholding loading />}>
    <WithholdingContent {...props} />
  </Suspense>
);

export default WithholdingPage;
