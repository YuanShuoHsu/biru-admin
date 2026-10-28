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

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getWaitlistEnumOptions } from "@/utils/enumOptions";
import { settle } from "@/utils/fetcher";
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

const WaitlistListContent = async ({
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

  const [memberRole, { data: tickets, error }] = await Promise.all([
    getMemberRole(selectedOrganization.id),
    settle(
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
    ),
  ]);
  if (error) return <ErrorAlert />;

  const { tickets: rows, total: rowCount } = tickets;

  const canViewAuditLog = hasRolePermission(memberRole, {
    auditLog: ["read"],
  });
  const canUpdate = hasRolePermission(memberRole, {
    waitlist: ["update"],
  });

  return (
    <WaitlistTickets
      canUpdate={canUpdate}
      canViewAuditLog={canViewAuditLog}
      filterField={filterField}
      filterOperator={filterOperator}
      filterValue={filterValue}
      organization={selectedOrganization}
      page={page}
      pageSize={pageSize}
      quickFilterValue={quickFilterValue}
      rowCount={rowCount}
      rows={rows}
      sortBy={sortBy}
      sortDirection={sortDirection}
    />
  );
};

const WaitlistListPage = (props: WaitlistListPageProps) => (
  <Suspense fallback={<WaitlistTickets loading />}>
    <WaitlistListContent {...props} />
  </Suspense>
);

export default WaitlistListPage;
