import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import OrganizationsSlugInvitations from ".";

import type { Locale } from "@/i18n/routing";

import { hasRolePermission, sortByCreatedAtDesc } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

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
  const { slug } = await params;

  const [data, session] = await Promise.all([
    getFullOrganization(decodeURIComponent(slug)),
    getSession(),
  ]);

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
