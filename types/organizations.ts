import { authClient } from "@/lib/auth-client";

export type ActiveOrganization = typeof authClient.$Infer.ActiveOrganization;
export type Invitation = typeof authClient.$Infer.Invitation;
export type Member = typeof authClient.$Infer.Member;
export type Organization = typeof authClient.$Infer.Organization;
export type Team = typeof authClient.$Infer.Team;

export type OrganizationMember = Omit<Member, "organizationId"> & {
  bio: string | null;
  firstName: string;
  image: string | null;
  lastName: string | null;
  teams: Pick<Team, "id" | "name">[];
};
