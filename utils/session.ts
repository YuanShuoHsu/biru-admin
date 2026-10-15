import { cookies } from "next/headers";
import { cache } from "react";
import { unstable_serialize } from "swr";

import { authClient } from "@/lib/auth-client";

import type { Menu } from "@/types/menus";

import { fetcher } from "@/utils/fetcher";
import {
  activeMemberRoleKey,
  resolveDefaultOrganizationSlug,
} from "@/utils/organizations";

export const getSession = cache(async () => {
  const cookieStore = await cookies();

  const { data } = await authClient.getSession({
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  return data;
});

export const listOrganizations = cache(async () => {
  const cookieStore = await cookies();

  const { data } = await authClient.organization.list({
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  return data ?? [];
});

export const getAdminOrganization = cache(
  async (organizationSlug: string | undefined) =>
    (await listOrganizations()).find(({ slug }) => slug === organizationSlug),
);

export const getDefaultOrganizationSlug = cache(async () => {
  const [session, organizations] = await Promise.all([
    getSession(),
    listOrganizations(),
  ]);

  return resolveDefaultOrganizationSlug(
    session?.session?.activeOrganizationId,
    organizations,
  );
});

export const getResolvedAdminOrganization = cache(
  async (organizationSlug: string | undefined) => {
    const [organizations, session] = await Promise.all([
      listOrganizations(),
      getSession(),
    ]);

    const defaultSlug = resolveDefaultOrganizationSlug(
      session?.session?.activeOrganizationId,
      organizations,
    );

    return (
      organizations.find(({ slug }) => slug === organizationSlug) ??
      organizations.find(({ slug }) => slug === defaultSlug)
    );
  },
);

export const getMemberRole = cache(async (organizationId: string) => {
  const cookieStore = await cookies();

  const { data } = await authClient.organization.getActiveMemberRole({
    query: { organizationId },
    fetchOptions: { headers: { cookie: cookieStore.toString() } },
  });

  return data?.role ?? null;
});

export const getDefaultMemberRoleFallback = async () => {
  const organization = await getResolvedAdminOrganization(undefined);

  if (!organization) return {};

  return {
    [unstable_serialize([activeMemberRoleKey, organization.slug])]:
      await getMemberRole(organization.id),
  };
};

export const getResolvedAdminOrganizationMenu = cache(
  async (organizationSlug: string | undefined) => {
    const [organization, cookieStore] = await Promise.all([
      getResolvedAdminOrganization(organizationSlug),
      cookies(),
    ]);

    if (!organization) return { organization: null, menu: null };

    const menus = await fetcher<Menu[]>(
      `/api/organizations/${organization.id}/menus`,
      { headers: { cookie: cookieStore.toString() } },
    );

    return { organization, menu: menus[0] };
  },
);

export const getAttendanceAccess = cache(
  async (organizationSlug: string | undefined) => {
    const organization = await getResolvedAdminOrganization(organizationSlug);

    if (!organization) return null;

    const memberRole = await getMemberRole(organization.id);

    if (!memberRole) return null;

    return { memberRole, organization };
  },
);
