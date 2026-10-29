import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugWaitlist from ".";

import type { Locale } from "@/i18n/routing";

import type { WaitlistSettingsResponse } from "@/types/waitlist";

import { fetcher } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

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

  const [data, session] = await Promise.all([
    getFullOrganization(organizationSlug),
    getSession(),
  ]);

  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  if (!hasRolePermission(currentUserRole, { waitlistSetting: ["read"] }))
    notFound();

  const settings = await fetcher<WaitlistSettingsResponse>(
    `/api/organizations/${organizationSlug}/waitlist/settings`,
    fetchOptions,
  ).catch(() => null);

  if (!settings) notFound();

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
