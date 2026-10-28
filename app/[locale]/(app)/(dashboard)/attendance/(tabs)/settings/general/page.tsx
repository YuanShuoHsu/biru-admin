import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Settings from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  getAttendanceSettings,
  getOccupationalIndustryRates,
} from "@/utils/attendance";
import { settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface SettingsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: SettingsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tAttendance = await getTranslations({
    locale,
    namespace: "attendance",
  });

  return { title: tAttendance("settings.label") };
};

const SettingsPage = async ({ params, searchParams }: SettingsPageProps) => {
  const [cookieStore, { locale }, { organization: organizationSlug }] =
    await Promise.all([cookies(), params, searchParams]);

  const access = await getAttendanceAccess(organizationSlug);

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (organizationSlug !== organization.slug) {
    const params = new URLSearchParams({ organization: organization.slug });

    redirect({
      href: `/attendance/settings/general?${params.toString()}`,
      locale,
    });
  }

  if (!hasRolePermission(memberRole, { attendanceSetting: ["read"] }))
    notFound();

  const init = { headers: { cookie: cookieStore.toString() } };

  const [
    { data: settings, error },
    { data: occupationalIndustryRates, error: occupationalIndustryRatesError },
  ] = await Promise.all([
    settle(getAttendanceSettings(organization.slug, init)),
    settle(getOccupationalIndustryRates(organization.slug, init)),
  ]);
  if (error || occupationalIndustryRatesError) return <ErrorAlert />;

  return (
    <Settings
      occupationalIndustryRates={occupationalIndustryRates}
      organization={organization}
      settings={settings}
    />
  );
};

export default SettingsPage;
