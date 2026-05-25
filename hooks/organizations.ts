"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

import type { Organization, OrganizationMember } from "@/types/organizations";
import type { RouteParams } from "@/types/routeParams";

export const useOrganization = () => {
  const { storeSlug } = useParams<RouteParams>();

  const { data: organization = null } = useSWR<Organization>(
    storeSlug ? `/api/organizations/${storeSlug}` : null,
  );

  return organization;
};

export const useOrganizationMembers = (organizationId: string) => {
  const { data: organizationMembers = [] } = useSWR<OrganizationMember[]>(
    organizationId ? `/api/organizations/${organizationId}/members` : null,
  );

  return organizationMembers;
};

export const useOrganizations = () => {
  const { data: organizations = [] } =
    useSWR<Organization[]>("/api/organizations");

  return organizations;
};
