"use client";

import { useSearchParams } from "next/navigation";
import useSWR, { type SWRConfiguration } from "swr";

import { authClient } from "@/lib/auth-client";

import type { Organization } from "@/types/organizations";

import { canRestoreDeletedRecords } from "@/utils/deletedRecords";
import {
  activeMemberRoleKey,
  defaultOrganizationSlugKey,
  resolveDefaultOrganizationSlug,
  sortByCreatedAtDesc,
} from "@/utils/organizations";

const deletedRecordPermissionKey = "deleted-record-permission";
const organizationsKey = "organizations";

export const useDefaultOrganizationSlug = () =>
  useSWR<string>(defaultOrganizationSlugKey, async () => {
    const [{ data: session }, { data: organizations }] = await Promise.all([
      authClient.getSession(),
      authClient.organization.list(),
    ]);

    return resolveDefaultOrganizationSlug(
      session?.session?.activeOrganizationId,
      organizations,
    );
  });

const useMemberRole = (organizationSlug: string) => {
  const { data: role } = useSWR(
    organizationSlug ? [activeMemberRoleKey, organizationSlug] : null,
    async ([, slug]: [string, string]) => {
      const { data } = await authClient.organization.getActiveMemberRole({
        query: { organizationSlug: slug },
      });

      return data?.role ?? null;
    },
  );

  return role;
};

export const useActiveMemberRole = () => {
  const { data: defaultOrganizationSlug = "" } = useDefaultOrganizationSlug();

  return useMemberRole(defaultOrganizationSlug);
};

export const useSelectedOrganizationSlug = () => {
  const { data: defaultOrganizationSlug = "" } = useDefaultOrganizationSlug();

  return useSearchParams().get("organization") || defaultOrganizationSlug;
};

export const useSelectedMemberRole = () =>
  useMemberRole(useSelectedOrganizationSlug());

export const useCanRestoreDeletedRecords = () => {
  const { data: organizationSlug = "" } = useDefaultOrganizationSlug();

  const { data: canRestore = false } = useSWR(
    organizationSlug ? [deletedRecordPermissionKey, organizationSlug] : null,
    ([, slug]: [string, string]) => canRestoreDeletedRecords(slug),
  );

  return canRestore;
};

const fetchOrganizations = async () => {
  const { data, error } = await authClient.organization.list();
  if (error) throw error;

  return sortByCreatedAtDesc(data);
};

export const useOrganizations = (config?: SWRConfiguration<Organization[]>) =>
  useSWR(organizationsKey, fetchOrganizations, config);

export const useOrganization = (organizationSlug?: string | null) => {
  const { data: organizations } = useSWR(
    organizationSlug ? organizationsKey : null,
    fetchOrganizations,
  );

  return organizations?.find(({ slug }) => slug === organizationSlug);
};

export const useOrganizationName = (organizationSlug?: string | null) =>
  useOrganization(organizationSlug)?.name;
