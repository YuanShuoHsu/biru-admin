// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import OrganizationsSlugMembers from ".";

import ErrorAlert from "@/components/ErrorAlert";

import type { Locale } from "@/i18n/routing";

import { settle } from "@/utils/fetcher";
import {
  getMemberPermissions,
  getPlatformAdminMemberIds,
  hasRolePermission,
  needsPlatformAdminMemberIds,
  sortByCreatedAtDesc,
} from "@/utils/organizations";
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

const OrganizationsSlugMembersPage = async ({
  params,
}: OrganizationsSlugMembersPageProps) => {
  const { slug } = await params;

  const [{ data, error }, session] = await Promise.all([
    settle(getFullOrganization(decodeURIComponent(slug))),
    getSession(),
  ]);

  if (error?.status === 400 || error?.status === 403) notFound();
  if (error) return <ErrorAlert />;
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
  const fetchesPlatformAdminMemberIds = needsPlatformAdminMemberIds(
    currentUserRole,
    session.user.role,
  );
  const { data: platformAdminMemberIds = [] } = fetchesPlatformAdminMemberIds
    ? await settle(
        getPlatformAdminMemberIds(data.id, {
          headers: { cookie: (await cookies()).toString() },
        }),
      )
    : { data: [] };

  const permissions = members.map((member) =>
    getMemberPermissions(member, {
      canDeleteMember,
      canUpdateMember,
      currentUserId: session.user.id,
      currentUserRole,
      members,
      platformAdminMemberIds,
    }),
  );
  const canUpdateMemberRoles = permissions.some(
    ({ canUpdateMemberRole }) => canUpdateMemberRole,
  );
  const canRemoveMembers = permissions.some(
    ({ canRemoveMember }) => canRemoveMember,
  );
  const canLeaveOrganizations = permissions.some(
    ({ canLeaveOrganization }) => canLeaveOrganization,
  );

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
      fetchesPlatformAdminMemberIds={fetchesPlatformAdminMemberIds}
      initialPlatformAdminMemberIds={platformAdminMemberIds}
    />
  );
};

export default OrganizationsSlugMembersPage;
