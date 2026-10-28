import type { useTranslations } from "next-intl";
import { cache } from "react";

import { fetcher } from "./fetcher";

import { authClient } from "@/lib/auth-client";

import type { Organization, OrganizationResponse } from "@/types/organizations";

export const getOrganization = cache((slug: OrganizationResponse["slug"]) =>
  fetcher<OrganizationResponse>(`/api/organizations/${slug}`),
);

export const getOrganizations = cache(
  (fetchOptions?: { headers: { cookie: string } }) =>
    fetcher<OrganizationResponse[]>(
      "/api/organizations?includeClosed=true",
      fetchOptions,
    ),
);

export const getOrganizationLabel = (
  tCommon: ReturnType<typeof useTranslations<"common">>,
  {
    closedAt,
    name,
  }: Pick<Organization | OrganizationResponse, "closedAt" | "name">,
) => (closedAt ? tCommon("organization.closed", { name }) : name);

export const sortByCreatedAtDesc = <T extends { createdAt: Date }>(
  items: T[],
) => items.toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export const activeMemberRoleKey = "active-member-role";

export const defaultOrganizationSlugKey = "default-organization-slug";

export const resolveDefaultOrganizationSlug = (
  activeOrganizationId: string | null | undefined,
  organizations: { id: string; slug: string }[] | null | undefined,
) =>
  organizations?.find(({ id }) => id === activeOrganizationId)?.slug ||
  organizations?.[0]?.slug ||
  "";

type CheckRolePermissionInput = Parameters<
  typeof authClient.organization.checkRolePermission
>[0];

export const hasRolePermission = (
  role: CheckRolePermissionInput["role"] | null | undefined,
  permissions: CheckRolePermissionInput["permissions"],
): boolean =>
  !!role && authClient.organization.checkRolePermission({ role, permissions });
