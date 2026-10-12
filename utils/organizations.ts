import { cache } from "react";

import { fetcher } from "./fetcher";

import { authClient } from "@/lib/auth-client";

import type {
  OrganizationDeletability,
  OrganizationResponse,
} from "@/types/organizations";

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

  const canDelete = await Promise.all(
    organizations.map(async ({ id }, index) => {
      if (
        !hasRolePermission(memberRoles[index].data?.role, {
          organization: ["delete"],
        })
      )
        return false;

      try {
        const { deletable } = await fetcher<OrganizationDeletability>(
          `/api/organizations/${id}/deletability`,
          fetchOptions,
        );

        return deletable;
      } catch {
        return false;
      }
    }),
  );

  const permissions: OrganizationPermissions = {};

  organizations.forEach(({ id }, index) => {
    permissions[id] = {
      canUpdateOrganization: hasRolePermission(memberRoles[index].data?.role, {
        organization: ["update"],
      }),
      canDeleteOrganization: canDelete[index],
    };
  });

  return permissions;
}
