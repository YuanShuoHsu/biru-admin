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

export const getAuditLogsPath = (organizationSlug: string) =>
  `/api/organizations/${organizationSlug}/audit-logs`;

export const getAuditLogs = cache(
  async (
    organizationSlug: string,
    resource: AuditResource | undefined,
    resourceId: string | undefined,
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
