import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import AuditLogs from "@/components/AuditLogs";
import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  auditLogFilterFieldValues,
  auditLogSortFieldValues,
  filterOperatorValues,
} from "@/types/api";
import type { AuditResource } from "@/types/audit";
import type { Ingredient } from "@/types/inventory";

import { getAuditLogs } from "@/utils/audit";
import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getAuditLogEnumOptions } from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
import { getOrganizations, hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

interface AuditLogSearchParams {
  actorId?: string;
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
  adminScope?: boolean;
  ancestorId?: string;
  href: string;
  ingredient?: Ingredient;
  locale: Locale;
  resource?: AuditResource;
  resourceId?: string;
  searchParams: AuditLogSearchParams;
}

const AuditLogsPage = async ({
  adminScope = false,
  ancestorId,
  href,
  ingredient,
  locale,
  resource,
  resourceId,
  searchParams,
}: AuditLogsPageProps) => {
  const cookieStore = await cookies();

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const session = adminScope ? await getSession() : undefined;

  const isAdmin = session?.user?.role === "admin";

  const selectedOrganization = isAdmin
    ? undefined
    : await getResolvedAdminOrganization(searchParams.organization);
  if (!isAdmin && !selectedOrganization) notFound();

  const {
    filterField,
    filterOperator,
    filterValue,
    page,
    pageSize,
    quickFilterValue,
    redirectParams,
    sortBy,
    sortDirection,
  } = resolveGridSearchParams({
    searchParams,
    sortFields: auditLogSortFieldValues,
    filterFields: auditLogFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization?.slug,
  });

  if (redirectParams)
    redirect({ href: `${href}?${redirectParams.toString()}`, locale });

  if (selectedOrganization) {
    const memberRole = await getMemberRole(selectedOrganization.id);
    if (!hasRolePermission(memberRole, { auditLog: ["read"] })) notFound();
  }

  const [tAudit, tCommon, { data: organizations, error: organizationsError }] =
    await Promise.all([
      getTranslations({ locale, namespace: "audit" }),
      getTranslations({ locale, namespace: "common" }),
      settle(isAdmin ? getOrganizations(fetchOptions) : Promise.resolve([])),
    ]);
  if (organizationsError) return <ErrorAlert />;

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(
        quickFilterValue,
        getAuditLogEnumOptions(tAudit, tCommon, !resource, organizations),
      )
    : [];

  const { data: auditLogs, error } = await settle(
    getAuditLogs(
      selectedOrganization?.slug,
      resource,
      resourceId,
      ancestorId,
      {
        actorId: searchParams.actorId,
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
    ),
  );
  if (error) return <ErrorAlert />;

  const { logs, total } = auditLogs;

  return (
    <AuditLogs
      ancestorId={ancestorId}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      ingredient={ingredient}
      key={selectedOrganization?.slug}
      logs={logs}
      organizations={organizations}
      organization={selectedOrganization}
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

type AuditLogsTarget = Pick<
  AuditLogsPageProps,
  "ancestorId" | "href" | "ingredient" | "resourceId"
>;

interface CreateAuditLogsPageOptions<Params> {
  adminScope?: boolean;
  resolveTarget: (
    params: Params,
    searchParams: AuditLogSearchParams,
  ) => AuditLogsTarget | Promise<AuditLogsTarget>;
  resource?: AuditResource;
}

interface AuditLogsRouteProps<Params> {
  params: Promise<Params & { locale: Locale }>;
  searchParams: Promise<AuditLogSearchParams>;
}

export const generateAuditLogsMetadata = async ({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> => {
  const { locale } = await params;
  const tAudit = await getTranslations({ locale, namespace: "audit" });

  return { title: tAudit("title") };
};

export const createAuditLogsPage = <Params extends object>({
  adminScope,
  resolveTarget,
  resource,
}: CreateAuditLogsPageOptions<Params>) => {
  const AuditLogsContent = async ({
    params,
    searchParams,
  }: AuditLogsRouteProps<Params>) => {
    const [routeParams, query] = await Promise.all([params, searchParams]);

    const target = await resolveTarget(routeParams, query);

    return (
      <AuditLogsPage
        {...target}
        adminScope={adminScope}
        locale={routeParams.locale}
        resource={resource}
        searchParams={query}
      />
    );
  };

  const AuditLogsRoute = (props: AuditLogsRouteProps<Params>) => (
    <Suspense fallback={<AuditLogs loading resource={resource} />}>
      <AuditLogsContent {...props} />
    </Suspense>
  );

  return AuditLogsRoute;
};
