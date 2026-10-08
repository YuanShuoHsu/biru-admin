import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import AdminWaitlist from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type { AdminWaitlistResponse } from "@/types/waitlist";

import { fetcher } from "@/utils/fetcher";
import { getResolvedAdminOrganization } from "@/utils/menus";

interface WaitlistPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: WaitlistPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tWaitlist = await getTranslations({ locale, namespace: "waitlist" });

  return { title: tWaitlist("board.label") };
};

const WaitlistPage = async ({ params, searchParams }: WaitlistPageProps) => {
  const [cookieStore, { locale }, { organization }] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const selectedOrganization = await getResolvedAdminOrganization(
    organization,
    cookieStore.toString(),
  );

  if (!selectedOrganization) return null;

  if (organization !== selectedOrganization.slug) {
    const params = new URLSearchParams({
      organization: selectedOrganization.slug,
    });

    redirect({ href: `/waitlist/board?${params.toString()}`, locale });
  }

  const waitlist = await fetcher<AdminWaitlistResponse>(
    `/api/organizations/${selectedOrganization.slug}/waitlist/tickets`,
    { headers: { cookie: cookieStore.toString() } },
  ).catch(() => null);

  if (!waitlist) return null;

  return (
    <AdminWaitlist organization={selectedOrganization} waitlist={waitlist} />
  );
};

export default WaitlistPage;
