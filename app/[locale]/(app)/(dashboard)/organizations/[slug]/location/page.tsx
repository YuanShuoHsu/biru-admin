import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugLocation from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { hasRolePermission } from "@/utils/organizations";

interface OrganizationsSlugLocationPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugLocationPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("organizations.location.label") };
};

const OrganizationsSlugLocationPage = async ({
  params,
}: OrganizationsSlugLocationPageProps) => {
  const [cookieStore, { locale, slug }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const [{ data }, { data: session }] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: { cookie: cookieStore.toString() } },
    }),
    authClient.getSession({
      fetchOptions: {
        headers: {
          cookie: cookieStore.toString(),
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    }),
  ]);

  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  const canUpdateLocation = hasRolePermission(currentUserRole, {
    organization: ["update"],
  });

  return (
    <OrganizationsSlugLocation
      activeOrganization={data}
      canUpdateLocation={canUpdateLocation}
    />
  );
};

export default OrganizationsSlugLocationPage;
