import type { TeamMember } from "better-auth/plugins";

import { authClient } from "@/lib/auth-client";

import type { ActiveOrganization, Member } from "@/types/organizations";

export type TeamMemberListItem = Member & {
  joinedAt: TeamMember["createdAt"];
};

export const toTeamMemberListItems = (
  teamMembers: TeamMember[],
  members: ActiveOrganization["members"],
): TeamMemberListItem[] => {
  const teamMemberListItems: TeamMemberListItem[] = [];

  for (const { userId, createdAt } of teamMembers.toReversed()) {
    const member = members.find(
      ({ userId: memberUserId }) => memberUserId === userId,
    );

    if (member) {
      teamMemberListItems.push({ ...member, joinedAt: createdAt });
    }
  }

  return teamMemberListItems;
};

export type OrganizationPermissions = Record<
  string,
  { canUpdateOrganization: boolean; canDeleteOrganization: boolean }
>;

export async function getOrganizationPermissions(
  organizations: { id: string }[],
  fetchOptions?: { headers: { cookie: string } },
): Promise<OrganizationPermissions> {
  const memberRoles = await Promise.all(
    organizations.map(({ id }) =>
      authClient.organization.getActiveMemberRole({
        query: { organizationId: id },
        ...(fetchOptions && { fetchOptions }),
      }),
    ),
  );

  const permissions: OrganizationPermissions = {};

  organizations.forEach(({ id }, index) => {
    const role = memberRoles[index].data?.role;
    if (!role) return;

    permissions[id] = {
      canUpdateOrganization: authClient.organization.checkRolePermission({
        role,
        permissions: { organization: ["update"] },
      }),
      canDeleteOrganization: authClient.organization.checkRolePermission({
        role,
        permissions: { organization: ["delete"] },
      }),
    };
  });

  return permissions;
}
