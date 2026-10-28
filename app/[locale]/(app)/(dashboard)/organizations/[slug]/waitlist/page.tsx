import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugWaitlist from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import type { WaitlistSettingsResponse } from "@/types/waitlist";

import { fetcher, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface OrganizationsSlugWaitlistPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugWaitlistPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("waitlist.label") };
};

const OrganizationsSlugWaitlistPage = async ({
  params,
}: OrganizationsSlugWaitlistPageProps) => {
  const [cookieStore, { slug }] = await Promise.all([cookies(), params]);

  const organizationSlug = decodeURIComponent(slug);
  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [{ data, error: organizationError }, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug },
      fetchOptions,
    }),
    getSession(),
  ]);

  if (organizationError?.status === 400 || organizationError?.status === 403)
    notFound();
  if (organizationError) return <ErrorAlert />;
  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  if (!hasRolePermission(currentUserRole, { waitlistSetting: ["read"] }))
    notFound();

  const { data: settings, error } = await settle(
    fetcher<WaitlistSettingsResponse>(
      `/api/organizations/${organizationSlug}/waitlist/settings`,
      fetchOptions,
    ),
  );
  if (error?.status === 404) notFound();
  if (error) return <ErrorAlert />;

  return (
    <OrganizationsSlugWaitlist
      canUpdateOrganization={hasRolePermission(currentUserRole, {
        organization: ["update"],
      })}
      canUpdateWaitlist={hasRolePermission(currentUserRole, {
        waitlistSetting: ["update"],
      })}
      organizationName={data.name}
      organizationSlug={organizationSlug}
      settings={settings}
    />
  );
};

export default OrganizationsSlugWaitlistPage;
