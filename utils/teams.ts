import type { TeamMember } from "better-auth/plugins";

import type { Member } from "@/types/organizations";

export type TeamMemberRow = Member & {
  joinedAt: TeamMember["createdAt"];
};

export const buildTeamMembers = (
  teamMembers: TeamMember[],
  members: Member[],
): TeamMemberRow[] => {
  const rows: TeamMemberRow[] = [];

  for (const { userId, createdAt } of teamMembers.toReversed()) {
    const member = members.find((m) => m.userId === userId);

    if (member) {
      rows.push({ ...member, joinedAt: createdAt });
    }
  }

  return rows;
};
