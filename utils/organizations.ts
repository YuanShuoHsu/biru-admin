import { authClient } from "@/lib/auth-client";

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
