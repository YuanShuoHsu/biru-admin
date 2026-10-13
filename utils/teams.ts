import type { TeamMember } from "better-auth/plugins";

import type { Member } from "@/types/organizations";

import { sortByCreatedAtDesc } from "@/utils/organizations";

export type TeamMemberRow = Member & {
  joinedAt: TeamMember["createdAt"];
};

export const buildTeamMembers = (
  teamMembers: TeamMember[],
  members: Member[],
): TeamMemberRow[] => {
  const rows: TeamMemberRow[] = [];

  for (const { createdAt, userId } of sortByCreatedAtDesc(teamMembers)) {
    const member = members.find(({ userId: memberId }) => memberId === userId);

    if (member) rows.push({ ...member, joinedAt: createdAt });
  }

  return rows;
};
