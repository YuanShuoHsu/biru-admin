import type { TeamMember } from "better-auth/plugins";

import type { ActiveOrganization } from "@/types/organizations";

export type TeamMemberRow = Omit<TeamMember, "teamId"> & {
  avatar: string | null;
  name: string;
  email: string;
  role: string;
};

export const toTeamMemberRow = (
  { id, userId, createdAt }: TeamMember,
  members: ActiveOrganization["members"],
): TeamMemberRow => {
  const {
    user: { name = "", email = "", image: avatar = null } = {},
    role = "",
  } = members.find(({ userId: memberUserId }) => memberUserId === userId) || {};

  return { id, userId, name, email, avatar, role, createdAt };
};
