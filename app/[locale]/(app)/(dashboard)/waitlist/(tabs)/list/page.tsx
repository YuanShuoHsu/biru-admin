import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";

import WaitlistTickets from ".";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { authClient } from "@/lib/auth-client";

import {
  filterOperatorValues,
  waitlistTicketFilterFieldValues,
  waitlistTicketSortFieldValues,
} from "@/types/api";

import { getQuickFilterEnums, resolveGridSearchParams } from "@/utils/dataGrid";
import { getWaitlistEnumOptions } from "@/utils/enumOptions";
import { getResolvedAdminOrganization } from "@/utils/menus";
import { hasRolePermission } from "@/utils/organizations";
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

const WaitlistListPage = async ({
  params,
  searchParams,
}: WaitlistListPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  setRequestLocale(locale);

  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const selectedOrganization = await getResolvedAdminOrganization(
    rawSearchParams.organization,
    cookieStore.toString(),
  );

  if (!selectedOrganization) return null;

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

  const [{ data: memberRole }, { tickets: rows, total: rowCount }] =
    await Promise.all([
      authClient.organization.getActiveMemberRole({
        query: { organizationId: selectedOrganization.id },
        fetchOptions,
      }),
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
    ]);

  const canViewAuditLog = hasRolePermission(memberRole?.role, {
    auditLog: ["read"],
  });
  const canUpdate = hasRolePermission(memberRole?.role, {
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

export default WaitlistListPage;
