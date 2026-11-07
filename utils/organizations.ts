import type { useTranslations } from "next-intl";
import { cache } from "react";

import { fetcher } from "./fetcher";

import { ROLE_RANK } from "@/constants/organizations";

import { authClient } from "@/lib/auth-client";

import type {
  Member,
  Organization,
  OrganizationResponse,
} from "@/types/organizations";

export const getOrganization = cache((slug: OrganizationResponse["slug"]) =>
  fetcher<OrganizationResponse>(`/api/organizations/${slug}`),
);

export const getPlatformAdminMemberIds = (
  organizationId: Organization["id"],
  init?: RequestInit,
) =>
  fetcher<Member["id"][]>(
    `/api/organizations/${organizationId}/platform-admin-members`,
    init,
  );

export const getOrganizations = cache(
  (fetchOptions?: { headers: { cookie: string } }) =>
    fetcher<OrganizationResponse[]>(
      "/api/organizations?includeClosed=true",
      fetchOptions,
    ),
);

export const getOrganizationLabel = (
  tCommon: ReturnType<typeof useTranslations<"common">>,
  {
    closedAt,
    name,
  }: Pick<Organization | OrganizationResponse, "closedAt" | "name">,
) => (closedAt ? tCommon("organization.closed", { name }) : name);

export const sortByCreatedAtDesc = <T extends { createdAt: Date }>(
  items: T[],
) => items.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export const activeMemberRoleKey = "active-member-role";

export const defaultOrganizationSlugKey = "default-organization-slug";

export const resolveDefaultOrganizationSlug = (
  activeOrganizationId: string | null | undefined,
  organizations: { id: string; slug: string }[] | null | undefined,
) =>
  organizations?.find(({ id }) => id === activeOrganizationId)?.slug ||
  organizations?.[0]?.slug ||
  "";

type CheckRolePermissionInput = Parameters<
  typeof authClient.organization.checkRolePermission
>[0];

export const hasRolePermission = (
  role: CheckRolePermissionInput["role"] | null | undefined,
  permissions: CheckRolePermissionInput["permissions"],
): boolean =>
  !!role && authClient.organization.checkRolePermission({ role, permissions });

type PermissionMember = Pick<
  Member,
  "id" | "joinedAsPlatformAdmin" | "role" | "userId"
>;

interface MemberPermissionContext {
  canDeleteMember: boolean;
  canUpdateMember: boolean;
  currentUserId: string;
  currentUserRole: string;
  members: Pick<Member, "joinedAsPlatformAdmin" | "role">[];
  platformAdminMemberIds: Member["id"][];
}

export const getMemberPermissions = (
  { id, joinedAsPlatformAdmin, role, userId }: PermissionMember,
  {
    canDeleteMember,
    canUpdateMember,
    currentUserId,
    currentUserRole,
    members,
    platformAdminMemberIds,
  }: MemberPermissionContext,
) => {
  const owners = members.filter((member) => member.role === "owner");
  const isOnlyOwner =
    role === "owner" &&
    (owners.length === 1 ||
      (!joinedAsPlatformAdmin &&
        owners.filter((owner) => !owner.joinedAsPlatformAdmin).length === 1));
  const isManageable =
    ROLE_RANK[currentUserRole] >= ROLE_RANK[role] &&
    !platformAdminMemberIds.includes(id);
  const isCurrentUser = userId === currentUserId;

  return {
    canUpdateMemberRole: canUpdateMember && !isOnlyOwner && isManageable,
    canRemoveMember:
      canDeleteMember && !isCurrentUser && !isOnlyOwner && isManageable,
    canLeaveOrganization: isCurrentUser && !isOnlyOwner,
    canTurnOnShowcase: isCurrentUser,
    canTurnOffShowcase: isCurrentUser || canUpdateMember,
  };
};
