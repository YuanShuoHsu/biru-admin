import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import AuditLogs from "@/components/AuditLogs";

import { NO_VALUE_FILTER_OPERATORS } from "@/constants/dataGrid";
import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  auditLogFilterFieldValues,
  auditLogSortFieldValues,
  filterOperatorValues,
  sortDirectionValues,
} from "@/types/api";
import type { AuditResource } from "@/types/audit";

import { getAuditLogs } from "@/utils/audit";
import { getQuickFilterEnums } from "@/utils/dataGrid";
import { getAuditLogEnumOptions } from "@/utils/enumOptions";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { getOrganizations, hasRolePermission } from "@/utils/organizations";

export interface AuditLogSearchParams {
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  organization?: string;
  page?: string;
  pageSize?: string;
  quickFilterEnums?: string | string[];
  quickFilterValue?: string;
  sortBy?: string;
  sortDirection?: string;
}

interface AuditLogsPageProps {
  ancestorId?: string;
  adminScope?: boolean;
  href: string;
  locale: Locale;
  resource?: AuditResource;
  resourceId?: string;
  searchParams: AuditLogSearchParams;
}

const AuditLogsPage = async ({
  ancestorId,
  adminScope = false,
  href,
  locale,
  resource,
  resourceId,
  searchParams,
}: AuditLogsPageProps) => {
  const {
    filterField: rawFilterField,
    filterOperator: rawFilterOperator,
    filterValue,
    organization,
    page: rawPage,
    pageSize: rawPageSize,
    quickFilterEnums: rawQuickFilterEnums,
    quickFilterValue,
    sortBy: rawSortBy,
    sortDirection: rawSortDirection,
    ...restSearchParams
  } = searchParams;

  const cookieStore = await cookies();

  const page = Math.max(1, Number(rawPage) || 1);
  const pageSize = Math.max(1, Number(rawPageSize) || DEFAULT_PAGE_SIZE);

  const sortBy = auditLogSortFieldValues.find((field) => field === rawSortBy);
  const sortDirection = sortDirectionValues.find(
    (direction) => direction === rawSortDirection,
  );

  const filterField = auditLogFilterFieldValues.find(
    (field) => field === rawFilterField,
  );
  const filterOperator = filterOperatorValues.find(
    (operator) => operator === rawFilterOperator,
  );
  const isNoValueOperator =
    !!filterOperator && NO_VALUE_FILTER_OPERATORS.includes(filterOperator);
  const hasFilter =
    !!filterField && !!filterOperator && (!!filterValue || isNoValueOperator);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const session = adminScope
    ? await authClient.getSession({ fetchOptions })
    : undefined;

  const isAdmin = session?.data?.user?.role === "admin";

  const selectedOrganization = isAdmin
    ? undefined
    : await getResolvedAdminOrganization(organization, cookieStore.toString());
  if (!isAdmin && !selectedOrganization) notFound();

  if (
    rawQuickFilterEnums !== undefined ||
    (!isAdmin && organization !== selectedOrganization?.slug) ||
    rawPage !== String(page) ||
    rawPageSize !== String(pageSize) ||
    rawSortBy !== sortBy ||
    rawSortDirection !== sortDirection ||
    !!sortBy !== !!sortDirection ||
    rawFilterField !== filterField ||
    rawFilterOperator !== filterOperator ||
    !!(filterField || filterOperator || filterValue) !== hasFilter
  ) {
    const params = new URLSearchParams({
      ...restSearchParams,
      ...(selectedOrganization && { organization: selectedOrganization.slug }),
      page: String(page),
      pageSize: String(pageSize),
      ...(sortBy && sortDirection && { sortBy, sortDirection }),
      ...(hasFilter &&
        filterField &&
        filterOperator && {
          filterField,
          filterOperator,
          ...(filterValue && { filterValue }),
        }),
      ...(quickFilterValue && { quickFilterValue }),
    });

    redirect({ href: `${href}?${params.toString()}`, locale });
  }

  if (selectedOrganization) {
    const { data: memberRole } =
      await authClient.organization.getActiveMemberRole({
        query: { organizationId: selectedOrganization.id },
        fetchOptions,
      });
    if (!hasRolePermission(memberRole?.role, { auditLog: ["read"] }))
      notFound();
  }

  const [tAudit, organizations] = await Promise.all([
    getTranslations({ locale, namespace: "audit" }),
    isAdmin ? getOrganizations(fetchOptions) : [],
  ]);

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAuditLogEnumOptions(tAudit, !resource, organizations),
      )
    : [];

  const { logs, total } = await getAuditLogs(
    selectedOrganization?.slug,
    resource,
    resourceId,
    ancestorId,
    {
      page,
      pageSize,
      filterField,
      filterOperator,
      filterValue,
      quickFilterEnums,
      quickFilterValue,
      sortBy,
      sortDirection,
    },
    fetchOptions,
  );

  return (
    <AuditLogs
      ancestorId={ancestorId}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      logs={logs}
      organizations={organizations}
      organizationSlug={selectedOrganization?.slug}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      resource={resource}
      resourceId={resourceId}
      rowCount={total}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

export default AuditLogsPage;
