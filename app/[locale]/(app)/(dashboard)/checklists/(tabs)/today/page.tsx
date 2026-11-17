import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import ChecklistToday from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type { ChecklistRun } from "@/types/checklists";

import { fetcher, settle } from "@/utils/fetcher";
import { getResolvedAdminOrganization } from "@/utils/session";

interface ChecklistTodayPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: ChecklistTodayPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tChecklists = await getTranslations({
    locale,
    namespace: "checklists",
  });

  return { title: tChecklists("today.label") };
};

const ChecklistTodayPage = async ({
  params,
  searchParams,
}: ChecklistTodayPageProps) => {
  const [cookieStore, { locale }, { organization }] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const selectedOrganization = await getResolvedAdminOrganization(organization);
  if (!selectedOrganization) notFound();

  if (organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
    });

    redirect({ href: `/checklists/today?${params.toString()}`, locale });
  }

  const { data: runs, error } = await settle(
    fetcher<ChecklistRun[]>(
      `/api/organizations/${selectedOrganization.slug}/checklists/today`,
      { headers: { cookie: cookieStore.toString() } },
    ),
  );
  if (error) return <ErrorAlert />;

  return (
    <ChecklistToday
      closed={!!selectedOrganization.closedAt}
      key={selectedOrganization.slug}
      organizationSlug={selectedOrganization.slug}
      runs={runs}
    />
  );
};

export default ChecklistTodayPage;
