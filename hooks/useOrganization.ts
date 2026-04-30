"use client";

import useSWR from "swr";

import { swrKeys } from "@/constants/swr";

import type { ActiveOrganization } from "@/types/organizations";

export const useOrganization = () => {
  const { data: organization = null } = useSWR<ActiveOrganization>(
    swrKeys.organization,
  );

  return organization;
};
