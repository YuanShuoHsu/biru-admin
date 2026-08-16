import { cache } from "react";

import { fetcher } from "./fetcher";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import type {
  AuditLogFilterField,
  AuditLogResponse,
  AuditLogSortField,
  AuditResource,
} from "@/types/audit";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";

interface GetAuditLogsQuery {
  filterField?: AuditLogFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  page?: number;
  pageSize?: number;
  quickFilterEnums?: string[];
  quickFilterValue?: string;
  sortBy?: AuditLogSortField;
  sortDirection?: SortDirection;
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
    case "userCoupon":
    case "coupon":
    case "banner":
      return null;
  }
};

export const getAuditLogs = cache(
  async (
    organizationSlug: string | undefined,
    resource: AuditResource | undefined,
    resourceId: string | undefined,
    ancestorId: string | undefined,
    {
      page = 1,
      pageSize = DEFAULT_PAGE_SIZE,
      filterField,
      filterOperator,
      filterValue,
      quickFilterEnums,
      quickFilterValue,
      sortBy,
      sortDirection,
    }: GetAuditLogsQuery = {},
    init?: RequestInit,
  ) => {
    try {
      const isNoValueOperator =
        filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
      const params = new URLSearchParams({
        ...(resource && { resource }),
        ...(resourceId && { resourceId }),
        ...(ancestorId && { ancestorId }),
        limit: String(pageSize),
        offset: String((page - 1) * pageSize),
        ...(sortBy && { sortBy }),
        ...(sortDirection && { sortDirection }),
        ...(filterField &&
          filterOperator &&
          (filterValue || isNoValueOperator) && {
            filterField,
            filterOperator,
            ...(filterValue && { filterValue }),
          }),
        ...(quickFilterValue && { quickFilterValue }),
      });
      for (const entry of quickFilterEnums || [])
        params.append("quickFilterEnums", entry);

      const result = await fetcher<{
        data: AuditLogResponse[];
        total: number;
      }>(`${getAuditLogsPath(organizationSlug)}?${params.toString()}`, init);

      return {
        logs: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
      };
    } catch {
      return { logs: [], total: 0 };
    }
  },
);
