import { cache } from "react";

import { fetcher } from "./fetcher";

import type {
  AuditLogFilterField,
  AuditLogListResponse,
  AuditLogSortField,
  AuditResource,
} from "@/types/audit";

import { type GridQuery, getGridSearchParams } from "@/utils/dataGrid";

interface GetAuditLogsQuery
  extends GridQuery<AuditLogFilterField, AuditLogSortField> {
  actorId?: string;
}

export const getAuditLogsPath = (organizationSlug?: string) =>
  organizationSlug
    ? `/api/organizations/${organizationSlug}/audit-logs`
    : "/api/audit-logs";

export const getAuditLogHref = (
  resource: AuditResource,
  resourceId: string,
  ancestorIds: string[] = [],
): string | null => {
  const [rootId, parentId] = ancestorIds;

  switch (resource) {
    case "menu":
      return "/menus/audit-logs";
    case "menuSection":
      return `/menus/sections/${resourceId}/audit-logs`;
    case "menuItem":
      return rootId
        ? `/menus/sections/${rootId}/${resourceId}/audit-logs`
        : null;
    case "menuItemAddOn":
      return rootId && parentId
        ? `/menus/sections/${rootId}/${parentId}/add-ons/${resourceId}/audit-logs`
        : null;
    case "menuItemModifierGroup":
      return rootId && parentId
        ? `/menus/sections/${rootId}/${parentId}/modifier-groups/${resourceId}/audit-logs`
        : null;
    case "modifierGroup":
      return `/menus/modifier-groups/${resourceId}/audit-logs`;
    case "modifier":
      return rootId
        ? `/menus/modifier-groups/${rootId}/${resourceId}/audit-logs`
        : null;
    case "order":
      return `/orders/list/${resourceId}/audit-logs`;
    case "invoice":
      return rootId ? `/orders/list/${rootId}/audit-logs` : null;
    case "supplier":
      return `/inventory/suppliers/${resourceId}/audit-logs`;
    case "ingredient":
      return `/inventory/ingredients/${resourceId}/audit-logs`;
    case "recipe":
      return rootId && parentId
        ? `/menus/sections/${rootId}/${parentId}/ingredients/${resourceId}/audit-logs`
        : null;
    case "storePhoto":
      return `/store-photos/${resourceId}/audit-logs`;
    case "operatingCost":
      return `/reports/operating-costs/${resourceId}/audit-logs`;
    case "userCoupon":
      return rootId ? `/coupons/${rootId}/audit-logs` : null;
    case "banner":
      return `/banners/${resourceId}/audit-logs`;
    case "waitlistTicket":
      return `/waitlist/list/${resourceId}/audit-logs`;
    case "cashDevice":
    case "catalogSection":
    case "catalogItem":
    case "catalogModifierGroup":
    case "catalogModifier":
    case "catalogItemModifierGroup":
    case "catalogItemAddOn":
    case "checklistTemplate":
    case "coupon":
    case "organization":
    case "member":
    case "invitation":
    case "user":
    case "team":
    case "pointSetting":
    case "pointTransaction":
    case "employee":
    case "attendanceSetting":
    case "leaveCase":
    case "leaveType":
    case "leaveBalance":
    case "leaveDeferral":
    case "holidaySubstitute":
    case "attendanceRequest":
    case "shift":
    case "shiftType":
    case "parentalChild":
    case "parentalReturn":
    case "payrollTerm":
    case "payslip":
    case "earningType":
    case "withholdingUnit":
    case "taxIdentity":
    case "withholdingCertificate":
      return null;
  }
};

export const getAuditLogs = cache(
  async (
    organizationSlug: string | undefined,
    resource: AuditResource | undefined,
    resourceId: string | undefined,
    ancestorId: string | undefined,
    { actorId, ...query }: GetAuditLogsQuery = {},
    init?: RequestInit,
  ) => {
    const params = getGridSearchParams(query);
    for (const [key, value] of Object.entries({
      resource,
      resourceId,
      ancestorId,
      actorId,
    }))
      if (value) params.set(key, value);

    const result = await fetcher<AuditLogListResponse>(
      `${getAuditLogsPath(organizationSlug)}?${params.toString()}`,
      init,
    );

    return {
      logs: Array.isArray(result.data) ? result.data : [],
      total: result.total || 0,
    };
  },
);
