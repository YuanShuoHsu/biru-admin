"use client";

import useSWR from "swr";

import { swrKeys } from "@/constants/swr";

import { authClient } from "@/lib/auth-client";

import { resolveDefaultOrganizationSlug } from "@/utils/organizations";

export const useDefaultOrganization = () => {
  const { data: defaultOrganizationSlug = "" } = useSWR<string>(
    swrKeys.defaultOrganizationSlug,
    async () => {
      const [{ data: session }, { data: organizations }] = await Promise.all([
        authClient.getSession(),
        authClient.organization.list(),
      ]);

      return resolveDefaultOrganizationSlug(
        session?.session?.activeOrganizationId,
        organizations,
      );
    },
  );

  return defaultOrganizationSlug;
};

export const useActiveMemberRole = () => {
  const organizationSlug = useDefaultOrganization();

  const { data: role } = useSWR(
    organizationSlug ? [swrKeys.activeMemberRole, organizationSlug] : null,
    async ([, slug]: [string, string]) => {
      const { data } = await authClient.organization.getActiveMemberRole({
        query: { organizationSlug: slug },
      });

      return data?.role ?? null;
    },
  );

  return role ?? undefined;
};
