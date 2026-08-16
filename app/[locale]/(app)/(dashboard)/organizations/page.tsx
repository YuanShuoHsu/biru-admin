import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import Organizations from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { getOrganizationPermissions } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface OrganizationsPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("organizations.label") };
};

const OrganizationsPage = async ({ params }: OrganizationsPageProps) => {
  const [cookieStore, { locale }] = await Promise.all([cookies(), params]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [{ data }, session] = await Promise.all([
    authClient.organization.list({ fetchOptions }),
    getSession(),
  ]);

  const organizations = (data || []).toReversed();

  const organizationPermissions = await getOrganizationPermissions(
    organizations,
    fetchOptions,
  );

  return (
    <Organizations
      canCreateOrganization={session?.user.role === "admin"}
      organizationPermissions={organizationPermissions}
      rows={organizations}
    />
  );
};

export default OrganizationsPage;
