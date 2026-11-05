import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Reports from ".";
import {
  getReportPath,
  getReportQuery,
  REPORT_TABS,
  resolveReportView,
} from "./definitions";

import ErrorAlert from "@/components/ErrorAlert";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import type {
  InventoryReportResponse,
  PersonnelCostReportResponse,
  SalesReportResponse,
} from "@/types/reports";

import { fetcher, settle } from "@/utils/fetcher";
import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

interface ReportsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    groupBy?: string;
    month?: string;
    organization?: string;
    since?: string;
    tab?: string;
    until?: string;
  }>;
}

export const generateMetadata = async ({
  params,
}: ReportsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tReports = await getTranslations({ locale, namespace: "reports" });

  return { title: tReports("label") };
};

const ReportsContent = async ({ params, searchParams }: ReportsPageProps) => {
  const [cookieStore, { locale }, rawSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams,
  ]);

  const [organization, session] = await Promise.all([
    getResolvedAdminOrganization(rawSearchParams.organization),
    getSession(),
  ]);

  if (!organization) notFound();

  const isAdmin = session?.user?.role === "admin";
  const memberRole = await getMemberRole(organization.id);

  const canViewSales =
    isAdmin || hasRolePermission(memberRole, { revenue: ["read"] });
  const canViewInventory =
    isAdmin ||
    hasRolePermission(memberRole, { inventoryTransaction: ["read"] });

  const canViewPersonnel =
    isAdmin || hasRolePermission(memberRole, { payslip: ["read"] });

  const tabPermissions = {
    inventory: canViewInventory,
    personnel: canViewPersonnel,
    sales: canViewSales,
  };

  const tabs = REPORT_TABS.filter((tab) => tabPermissions[tab]);

  if (!tabs.length) notFound();

  const view = resolveReportView(rawSearchParams, tabs);

  const canonicalParams = new URLSearchParams({
    organization: organization.slug,
    tab: view.tab,
    since: view.since,
    until: view.until,
    groupBy: view.groupBy,
    month: view.month,
  });

  if (
    [...canonicalParams].some(
      ([key, value]) =>
        rawSearchParams[key as keyof typeof rawSearchParams] !== value,
    )
  )
    redirect({ href: `/reports?${canonicalParams.toString()}`, locale });

  const fetchOptions = {
    headers: { "Accept-Language": locale, cookie: cookieStore.toString() },
  };
  const reportUrl = `${getReportPath(organization.slug, view.tab)}?${getReportQuery(view)}`;

  const [salesResult, inventoryResult, personnelResult] = await Promise.all([
    settle(
      view.tab === "sales"
        ? fetcher<SalesReportResponse>(reportUrl, fetchOptions)
        : Promise.resolve(undefined),
    ),
    settle(
      view.tab === "inventory"
        ? fetcher<InventoryReportResponse>(reportUrl, fetchOptions)
        : Promise.resolve(undefined),
    ),
    settle(
      view.tab === "personnel"
        ? fetcher<PersonnelCostReportResponse>(reportUrl, fetchOptions)
        : Promise.resolve(undefined),
    ),
  ]);

  if (salesResult.error || inventoryResult.error || personnelResult.error)
    return <ErrorAlert />;

  return (
    <Reports
      canViewInventory={canViewInventory}
      canViewPersonnel={canViewPersonnel}
      canViewSales={canViewSales}
      inventory={inventoryResult.data}
      key={organization.slug}
      organization={organization}
      personnel={personnelResult.data}
      sales={salesResult.data}
      view={view}
    />
  );
};

const ReportsPage = (props: ReportsPageProps) => (
  <Suspense fallback={<Reports loading />}>
    <ReportsContent {...props} />
  </Suspense>
);

export default ReportsPage;
