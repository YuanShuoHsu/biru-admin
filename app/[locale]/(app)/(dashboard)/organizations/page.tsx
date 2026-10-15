import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import Organizations from ".";

import type { Locale } from "@/i18n/routing";

import {
  getOrganizationPermissions,
  sortByCreatedAtDesc,
} from "@/utils/organizations";
import { getSession, listOrganizations } from "@/utils/session";

interface OrganizationsPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("label") };
};

const OrganizationsPage = async () => {
  const cookieStore = await cookies();

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [data, session] = await Promise.all([
    listOrganizations(),
    getSession(),
  ]);

  const organizations = sortByCreatedAtDesc(data);

  const organizationPermissions = await getOrganizationPermissions(
    organizations,
    fetchOptions,
  );

  return (
    <Organizations
      canCloseOrganization={session?.user.role === "admin"}
      canCreateOrganization={session?.user.role === "admin"}
      organizationPermissions={organizationPermissions}
      rows={organizations}
    />
  );
};

export default OrganizationsPage;
