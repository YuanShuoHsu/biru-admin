import { authClient } from "@/lib/auth-client";

import type { components } from "@/types/api";

export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;
export type Invitation = typeof authClient.$Infer.Invitation;
export type Member = typeof authClient.$Infer.Member;
export type Organization = typeof authClient.$Infer.Organization;
export type Team = typeof authClient.$Infer.Team;

export type OrganizationResponse =
  components["schemas"]["OrganizationResponseDto"];
export type OrganizationMember =
  components["schemas"]["OrganizationMemberResponseDto"];
