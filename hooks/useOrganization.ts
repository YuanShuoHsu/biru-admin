"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";

import type { Organization } from "@/types/organizations";
import type { RouteParams } from "@/types/routeParams";

export const useOrganization = () => {
  const { slug, storeSlug } = useParams<RouteParams<"slug" | "storeSlug">>();
  const organizationSlug = storeSlug || slug;

  const { data: organization = null } = useSWR<Organization>(
    organizationSlug ? `/api/organizations/${organizationSlug}` : null,
  );

  return organization;
};
