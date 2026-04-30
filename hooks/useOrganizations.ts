"use client";

import useSWR from "swr";

import { swrKeys } from "@/constants/swr";

import type { Organization } from "@/types/organizations";

export const useOrganizations = () => {
  const { data: organizations = [] } = useSWR<Organization[]>(
    swrKeys.organizations,
  );

  return organizations;
};
