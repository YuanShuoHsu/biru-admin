import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import OrganizationsSlugMembers from ".";

import { ROLE_RANK } from "@/constants/organizations";

import type { Locale } from "@/i18n/routing";

import { hasRolePermission, sortByCreatedAtDesc } from "@/utils/organizations";
import { getFullOrganization, getSession } from "@/utils/session";

interface OrganizationsSlugMembersPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugMembersPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("members.label") };
};

const OrganizationsSlugMembersContent = async ({
  params,
}: OrganizationsSlugMembersPageProps) => {
  const { slug } = await params;

  const [data, session] = await Promise.all([
    getFullOrganization(decodeURIComponent(slug)),
    getSession(),
  ]);

  if (!data || !session?.user?.id) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session.user.id,
  )?.role;

  if (!currentUserRole) notFound();

  const canCreateInvitation = hasRolePermission(currentUserRole, {
    invitation: ["create"],
  });
  const canDeleteMember = hasRolePermission(currentUserRole, {
    member: ["delete"],
  });
  const canUpdateMember = hasRolePermission(currentUserRole, {
    member: ["update"],
  });

  const members = sortByCreatedAtDesc(data.members);
  const ownerCount = members.filter(({ role }) => role === "owner").length;

  const canUpdateMemberRoles =
    canUpdateMember &&
    members.some(({ role }) => {
      const isOnlyOwner = role === "owner" && ownerCount === 1;
      const isHigherRoleRank = ROLE_RANK[currentUserRole] >= ROLE_RANK[role];

      return !isOnlyOwner && isHigherRoleRank;
    });
  const canRemoveMembers =
    canDeleteMember &&
    members.some(({ role, userId }) => {
      const isOnlyOwner = role === "owner" && ownerCount === 1;
      const isCurrentUser = userId === session.user.id;

      return !isCurrentUser && !isOnlyOwner;
    });
  const canLeaveOrganizations = members.some(({ role, userId }) => {
    const isOnlyOwner = role === "owner" && ownerCount === 1;

    return userId === session.user.id && !isOnlyOwner;
  });

  return (
    <OrganizationsSlugMembers
      activeOrganization={{ ...data, members }}
      canCreateInvitation={canCreateInvitation}
      canDeleteMember={canDeleteMember}
      canLeaveOrganizations={canLeaveOrganizations}
      canRemoveMembers={canRemoveMembers}
      canUpdateMember={canUpdateMember}
      canUpdateMemberRoles={canUpdateMemberRoles}
      currentUserId={session.user.id}
      currentUserRole={currentUserRole}
    />
  );
};

const OrganizationsSlugMembersPage = (
  props: OrganizationsSlugMembersPageProps,
) => (
  <Suspense fallback={<OrganizationsSlugMembers loading />}>
    <OrganizationsSlugMembersContent {...props} />
  </Suspense>
);

export default OrganizationsSlugMembersPage;
