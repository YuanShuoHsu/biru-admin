import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import OrganizationsSlugInvitations from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { hasRolePermission, sortByCreatedAtDesc } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface OrganizationsSlugInvitationsPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugInvitationsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("invitations.label") };
};

const OrganizationsSlugInvitationsContent = async ({
  params,
}: OrganizationsSlugInvitationsPageProps) => {
  const [cookieStore, { slug }] = await Promise.all([cookies(), params]);

  const cookieHeader = cookieStore.toString();

  const [{ data, error }, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: { cookie: cookieHeader } },
    }),
    getSession(),
  ]);

  if (error?.status === 400 || error?.status === 403) notFound();
  if (error) return <ErrorAlert />;
  if (!data) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session?.user?.id,
  )?.role;

  const canCancelInvitation = hasRolePermission(currentUserRole, {
    invitation: ["cancel"],
  });

  return (
    <OrganizationsSlugInvitations
      activeOrganization={{
        ...data,
        invitations: sortByCreatedAtDesc(
          data.invitations.filter(({ status }) => status === "pending"),
        ),
      }}
      canCancelInvitation={canCancelInvitation}
    />
  );
};

const OrganizationsSlugInvitationsPage = (
  props: OrganizationsSlugInvitationsPageProps,
) => (
  <Suspense fallback={<OrganizationsSlugInvitations loading />}>
    <OrganizationsSlugInvitationsContent {...props} />
  </Suspense>
);

export default OrganizationsSlugInvitationsPage;
