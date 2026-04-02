import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Organizations from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getOrganizationPermissions } from "@/utils/organizations";

interface OrganizationsPageProps {
  params: Promise<{ locale: Locale }>;
}

const OrganizationsPage = async ({ params }: OrganizationsPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const { data } = await authClient.organization.list({ fetchOptions });

  const organizations = (data || []).toReversed();

  const organizationPermissions = await getOrganizationPermissions(
    organizations,
    fetchOptions,
  );

  return (
    <Organizations
      organizationPermissions={organizationPermissions}
      rows={organizations}
    />
  );
};

export default OrganizationsPage;
