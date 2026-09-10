import {
  type components,
  auditLogFilterFieldValues,
  auditLogSortFieldValues,
} from "@/types/api";

export type AuditLogResponse = components["schemas"]["AuditLogResponseDto"];
export type AuditResource = components["schemas"]["AuditResource"];
export type AuditAction = components["schemas"]["AuditAction"];

export type AuditLogFilterField = (typeof auditLogFilterFieldValues)[number];
export type AuditLogSortField = (typeof auditLogSortFieldValues)[number];
