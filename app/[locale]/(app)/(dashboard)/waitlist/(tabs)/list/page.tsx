// https://nextjs.org/docs/app/guides/streaming#status-codes

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import WaitlistTickets from ".";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import {
  filterOperatorValues,
  waitlistTicketFilterFieldValues,
  waitlistTicketSortFieldValues,
} from "@/types/api";
import type { FilterOperator, SortDirection } from "@/types/dataGrid";
import type { Organization } from "@/types/organizations";
import type {
  WaitlistTicketFilterField,
  WaitlistTicketListItem,
  WaitlistTicketSortField,
} from "@/types/waitlist";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getWaitlistEnumOptions } from "@/utils/enumOptions";
import { type FetchResult, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import { getMemberRole, getResolvedAdminOrganization } from "@/utils/session";
import { getWaitlistTickets } from "@/utils/waitlist";

interface WaitlistListPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
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
  }>;
}

export const generateMetadata = async ({
  params,
}: WaitlistListPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tWaitlist = await getTranslations({ locale, namespace: "waitlist" });

  return { title: tWaitlist("list.label") };
};

interface WaitlistListContentProps {
  canUpdate: boolean;
  canViewAuditLog: boolean;
  filterField?: WaitlistTicketFilterField;
  filterOperator?: FilterOperator;
  filterValue?: string;
  organization: Organization;
  page: number;
  pageSize: number;
  quickFilterValue?: string;
  sortBy?: WaitlistTicketSortField;
  sortDirection?: SortDirection;
  tickets: Promise<
    FetchResult<{ tickets: WaitlistTicketListItem[]; total: number }>
  >;
}

const WaitlistListContent = async ({
  tickets: ticketsResult,
  ...props
}: WaitlistListContentProps) => {
  const { data: tickets, error } = await ticketsResult;
  if (error) return <ErrorAlert />;

  const { tickets: rows, total: rowCount } = tickets;

  return (
    <WaitlistTickets
      {...props}
      key={props.organization.slug}
      rowCount={rowCount}
      rows={rows}
    />
  );
};

const WaitlistListPage = async ({
  params,
  searchParams,
}: WaitlistListPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
  );
  if (!selectedOrganization) notFound();

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
    searchParams: rawSearchParams,
    sortFields: waitlistTicketSortFieldValues,
    filterFields: waitlistTicketFilterFieldValues,
    filterOperators: filterOperatorValues,
    organizationSlug: selectedOrganization.slug,
  });

  if (redirectParams)
    redirect({ href: `/waitlist/list?${redirectParams.toString()}`, locale });

  const tWaitlist = await getTranslations({ locale, namespace: "waitlist" });

  const quickFilterEnums = quickFilterValue
    ? getQuickFilterEnums(quickFilterValue, getWaitlistEnumOptions(tWaitlist))
    : [];

  const tickets = settle(
    getWaitlistTickets(
      selectedOrganization.slug,
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
    ),
  );

  const memberRole = await getMemberRole(selectedOrganization.id);

  const canViewAuditLog = hasRolePermission(memberRole, {
    auditLog: ["read"],
  });
  const canUpdate = hasRolePermission(memberRole, {
    waitlist: ["update"],
  });

  return (
    <Suspense fallback={<WaitlistTickets loading />}>
      <WaitlistListContent
        canUpdate={canUpdate}
        canViewAuditLog={canViewAuditLog}
        filterField={filterField}
        filterOperator={filterOperator}
        filterValue={filterValue}
        organization={selectedOrganization}
        page={page}
        pageSize={pageSize}
        quickFilterValue={quickFilterValue}
        sortBy={sortBy}
        sortDirection={sortDirection}
        tickets={tickets}
      />
    </Suspense>
  );
};

export default WaitlistListPage;
