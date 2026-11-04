import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Reports from ".";

import type { Locale } from "@/i18n/routing";

import { hasRolePermission } from "@/utils/organizations";
import {
  getMemberRole,
  getResolvedAdminOrganization,
  getSession,
} from "@/utils/session";

interface ReportsPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

export const generateMetadata = async ({
  params,
}: ReportsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tReports = await getTranslations({ locale, namespace: "reports" });

  return { title: tReports("label") };
};

const ReportsContent = async ({ searchParams }: ReportsPageProps) => {
  const { organization: organizationSlug } = await searchParams;

  const [organization, session] = await Promise.all([
    getResolvedAdminOrganization(organizationSlug),
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

  if (!canViewSales && !canViewInventory) notFound();

  return (
    <Reports
      canViewInventory={canViewInventory}
      canViewSales={canViewSales}
      key={organization.slug}
      organization={organization}
    />
  );
};

const ReportsPage = (props: ReportsPageProps) => (
  <Suspense fallback={<Reports loading />}>
    <ReportsContent {...props} />
  </Suspense>
);

export default ReportsPage;
