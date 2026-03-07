import { RoleEnum } from "@/enums/Role";

export const role = {
  defaultRole: RoleEnum.User,
  roles: [RoleEnum.Admin, RoleEnum.Manager, RoleEnum.Staff, RoleEnum.User],
} as const;
