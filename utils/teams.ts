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

  for (const { createdAt, userId } of teamMembers.toReversed()) {
    const member = members.find(({ userId: memberId }) => memberId === userId);

    if (member) rows.push({ ...member, joinedAt: createdAt });
  }

  return rows;
};
