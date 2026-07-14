import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugPoints from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface OrganizationsSlugPointsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const OrganizationsSlugPointsPage = async ({
  params,
}: OrganizationsSlugPointsPageProps) => {
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

  const canUpdatePoints = currentUserRole
    ? authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { organization: ["update"] },
      })
    : false;

  return (
    <OrganizationsSlugPoints
      activeOrganization={data}
      canUpdatePoints={canUpdatePoints}
    />
  );
};

export default OrganizationsSlugPointsPage;
