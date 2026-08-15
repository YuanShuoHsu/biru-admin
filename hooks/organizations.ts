"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

import { swrKeys } from "@/constants/swr";

import { authClient } from "@/lib/auth-client";

import type { Organization, OrganizationMember } from "@/types/organizations";
import type { RouteParams } from "@/types/routeParams";

export const useDefaultOrganization = () => {
  const { data: defaultOrganizationSlug = "" } = useSWR<string>(
    swrKeys.defaultOrganizationSlug,
    async () => {
      const [{ data: session }, { data: organizations }] = await Promise.all([
        authClient.getSession(),
        authClient.organization.list(),
      ]);

      return (
        organizations?.find(
          ({ id }) => id === session?.session?.activeOrganizationId,
        )?.slug ||
        organizations?.[0]?.slug ||
        ""
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

export const useOrganization = () => {
  const { organizationSlug } = useParams<RouteParams>();

  const { data: organization = null } = useSWR<Organization>(
    organizationSlug ? `/api/organizations/${organizationSlug}` : null,
  );

  return organization;
};

export const useOrganizationMembers = (organizationId: string) => {
  const { data: organizationMembers = [] } = useSWR<OrganizationMember[]>(
    organizationId ? `/api/organizations/${organizationId}/members` : null,
  );

  return organizationMembers;
};
