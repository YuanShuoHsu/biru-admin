export const roles = ["owner", "admin", "member"] as const;

export const ROLE_RANK: Record<string, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export const countKeys = {
  pendingInvitations: "pending-invitations",
} as const;
