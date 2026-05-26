import { setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugInvitations from ".";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

interface OrganizationsSlugInvitationsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

const OrganizationsSlugInvitationsPage = async ({
  params,
}: OrganizationsSlugInvitationsPageProps) => {
  const [cookieStore, { locale, slug }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const cookieHeader = cookieStore.toString();

  const [{ data }, { data: session }] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: { cookie: cookieHeader } },
    }),
    authClient.getSession({
      fetchOptions: {
        headers: {
          cookie: cookieHeader,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    }),
  ]);

  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  const canCancelInvitation = currentUserRole
    ? authClient.organization.checkRolePermission({
        role: currentUserRole,
        permissions: { invitation: ["cancel"] },
      })
    : false;

  return (
    <OrganizationsSlugInvitations
      activeOrganization={{
        ...data,
        invitations: data.invitations
          .toReversed()
          .filter(({ status }) => status === "pending"),
      }}
      canCancelInvitation={canCancelInvitation}
    />
  );
};

export default OrganizationsSlugInvitationsPage;
