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

export async function canGrantOrganizationCoupon(
  organizationId?: string,
  fetchOptions?: { headers: { cookie: string; origin: string } },
): Promise<boolean> {
  if (!organizationId) return false;

  try {
    const { success } = await fetcher<{ success: boolean }>(
      "/api/auth/organization/has-permission",
      {
        body: JSON.stringify({
          organizationId,
          permissions: { coupon: ["create"] },
        }),
        headers: {
          "Content-Type": "application/json",
          ...fetchOptions?.headers,
        },
        method: "POST",
      },
    );

    return success;
  } catch {
    return false;
  }
}

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

    if (!role) {
      permissions[id] = {
        canUpdateOrganization: false,
        canDeleteOrganization: false,
      };

      return;
    }

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
