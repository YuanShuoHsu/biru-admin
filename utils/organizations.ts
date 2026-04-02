import { authClient } from "@/lib/auth-client";

export type OrganizationPermissions = Record<
  string,
  { canUpdate: boolean; canDelete: boolean }
>;

export async function getOrganizationPermissions(
  organizations: { id: string }[],
  fetchOptions?: { headers: { cookie: string } },
): Promise<OrganizationPermissions> {
  const memberRoles = await Promise.all(
    organizations.map((org) =>
      authClient.organization.getActiveMemberRole({
        query: { organizationId: org.id },
        ...(fetchOptions && { fetchOptions }),
      }),
    ),
  );

  const permissions: OrganizationPermissions = {};
  for (let i = 0; i < organizations.length; i++) {
    const role = memberRoles[i].data?.role as
      | "owner"
      | "admin"
      | "member"
      | undefined;
    if (role) {
      permissions[organizations[i].id] = {
        canUpdate: authClient.organization.checkRolePermission({
          role,
          permissions: { organization: ["update"] },
        }),
        canDelete: authClient.organization.checkRolePermission({
          role,
          permissions: { organization: ["delete"] },
        }),
      };
    }
  }
  return permissions;
}
