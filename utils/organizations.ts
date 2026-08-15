import { cache } from "react";

import { fetcher } from "./fetcher";

import { authClient } from "@/lib/auth-client";

import type { OrganizationResponse } from "@/types/organizations";

export const getOrganization = cache(
  async (slug: OrganizationResponse["slug"]) => {
    try {
      return await fetcher<OrganizationResponse>(`/api/organizations/${slug}`);
    } catch {
      return null;
    }
  },
);

export const getOrganizations = cache(
  async (fetchOptions?: { headers: { cookie: string } }) => {
    try {
      return await fetcher<OrganizationResponse[]>(
        "/api/organizations",
        fetchOptions,
      );
    } catch {
      return [];
    }
  },
);

type CheckRolePermissionInput = Parameters<
  typeof authClient.organization.checkRolePermission
>[0];

export const hasRolePermission = (
  role: CheckRolePermissionInput["role"] | undefined,
  permissions: CheckRolePermissionInput["permissions"],
): boolean =>
  !!role && authClient.organization.checkRolePermission({ role, permissions });

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

    permissions[id] = {
      canUpdateOrganization: hasRolePermission(role, {
        organization: ["update"],
      }),
      canDeleteOrganization: hasRolePermission(role, {
        organization: ["delete"],
      }),
    };
  });

  return permissions;
}
