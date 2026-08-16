import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugMembers from ".";

import { ROLE_RANK } from "@/constants/organizations";

import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import { hasRolePermission } from "@/utils/organizations";
import { getSession } from "@/utils/session";

interface OrganizationsSlugMembersPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsSlugMembersPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return { title: t("organizations.members.label") };
};

const OrganizationsSlugMembersPage = async ({
  params,
}: OrganizationsSlugMembersPageProps) => {
  const [cookieStore, { locale, slug }] = await Promise.all([
    cookies(),
    params,
  ]);

  setRequestLocale(locale);

  const cookieHeader = cookieStore.toString();

  const [{ data }, session] = await Promise.all([
    authClient.organization.getFullOrganization({
      query: { organizationSlug: decodeURIComponent(slug) },
      fetchOptions: { headers: { cookie: cookieHeader } },
    }),
    getSession(),
  ]);

  if (!data || !session?.user?.id) notFound();

  const currentUserRole = data.members.find(
    ({ userId }) => userId === session.user.id,
  )?.role;

  if (!currentUserRole) notFound();

  const { canCreateInvitation, canDeleteMember, canUpdateMember } = {
    canCreateInvitation: hasRolePermission(currentUserRole, {
      invitation: ["create"],
    }),
    canDeleteMember: hasRolePermission(currentUserRole, {
      member: ["delete"],
    }),
    canUpdateMember: hasRolePermission(currentUserRole, {
      member: ["update"],
    }),
  };

  const members = data.members.toReversed();
  const ownerCount = members.filter(({ role }) => role === "owner").length;

  const { canUpdateMemberRoles, canRemoveMembers, canLeaveOrganizations } = {
    canUpdateMemberRoles:
      canUpdateMember &&
      members.some(({ role }) => {
        const isOnlyOwner = role === "owner" && ownerCount === 1;
        const isHigherRoleRank = ROLE_RANK[currentUserRole] >= ROLE_RANK[role];

        return !isOnlyOwner && isHigherRoleRank;
      }),
    canRemoveMembers:
      canDeleteMember &&
      members.some(({ role, userId }) => {
        const isOnlyOwner = role === "owner" && ownerCount === 1;
        const isCurrentUser = userId === session.user.id;

        return !isCurrentUser && !isOnlyOwner;
      }),
    canLeaveOrganizations: members.some(
      ({ userId }) => userId === session.user.id && ownerCount > 1,
    ),
  };

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

export default OrganizationsSlugMembersPage;
