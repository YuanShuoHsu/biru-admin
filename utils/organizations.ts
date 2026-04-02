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
      canUpdate: authClient.organization.checkRolePermission({
        role,
        permissions: { organization: ["update"] },
      }),
      canDelete: authClient.organization.checkRolePermission({
        role,
        permissions: { organization: ["delete"] },
      }),
    };
  });

  return permissions;
}
