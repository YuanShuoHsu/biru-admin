import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Settings from ".";

import AttendanceTabsLayout from "../AttendanceTabsLayout";

import type { Locale } from "@/i18n/routing";

import { getAttendanceAccess, getAttendanceSettings } from "@/utils/attendance";
import { hasRolePermission } from "@/utils/organizations";

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

  setRequestLocale(locale);

  const access = await getAttendanceAccess(
    organizationSlug,
    cookieStore.toString(),
  );

  if (!access) notFound();

  const { memberRole, organization } = access;

  if (!hasRolePermission(memberRole, { attendanceSetting: ["read"] }))
    notFound();

  const settings = await getAttendanceSettings(organization.slug, {
    headers: { cookie: cookieStore.toString() },
  });

  return (
    <AttendanceTabsLayout memberRole={memberRole}>
      <Settings organizationSlug={organization.slug} settings={settings} />
    </AttendanceTabsLayout>
  );
};

export default SettingsPage;
