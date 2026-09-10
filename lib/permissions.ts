import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  auditLog: ["read"],
  coupon: ["create", "read"],
  inventory: ["create", "update", "delete", "read"],
  inventoryTransaction: ["create", "read"],
  itemAvailability: ["update"],
  menu: ["create", "update", "delete", "read"],
  order: ["read", "update"],
  purchasing: ["create", "update", "delete", "read"],
  revenue: ["read"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
  auditLog: ["read"],
  coupon: ["create", "read"],
  inventory: ["create", "update", "delete", "read"],
  inventoryTransaction: ["create", "read"],
  itemAvailability: ["update"],
  menu: ["create", "update", "delete", "read"],
  order: ["read", "update"],
  purchasing: ["create", "update", "delete", "read"],
  revenue: ["read"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  auditLog: ["read"],
  coupon: ["create", "read"],
  inventory: ["create", "update", "delete", "read"],
  inventoryTransaction: ["create", "read"],
  itemAvailability: ["update"],
  menu: ["create", "update", "delete", "read"],
  order: ["read", "update"],
  purchasing: ["create", "update", "delete", "read"],
  revenue: ["read"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  coupon: ["read"],
  inventory: ["read"],
  inventoryTransaction: ["create", "read"],
  itemAvailability: ["update"],
  menu: ["read"],
  order: ["read", "update"],
});
