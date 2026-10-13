"use client";

import useSWR, { type SWRConfiguration } from "swr";

import { authClient } from "@/lib/auth-client";

import type { Organization } from "@/types/organizations";

import { canRestoreDeletedRecords } from "@/utils/deletedRecords";
import {
  defaultOrganizationSlugKey,
  resolveDefaultOrganizationSlug,
  sortByCreatedAtDesc,
} from "@/utils/organizations";

const activeMemberRoleKey = "active-member-role";
const deletedRecordPermissionKey = "deleted-record-permission";
const organizationsKey = "organizations";

export const useDefaultOrganization = () => {
  const { data: defaultOrganizationSlug = "" } = useSWR<string>(
    defaultOrganizationSlugKey,
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
    organizationSlug ? [activeMemberRoleKey, organizationSlug] : null,
    async ([, slug]: [string, string]) => {
      const { data } = await authClient.organization.getActiveMemberRole({
        query: { organizationSlug: slug },
      });

      return data?.role ?? null;
    },
  );

  return role ?? undefined;
};

export const useCanRestoreDeletedRecords = () => {
  const organizationSlug = useDefaultOrganization();

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
