import { notFound } from "next/navigation";

import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { hasRolePermission } from "@/utils/organizations";
import { getAttendanceAccess } from "@/utils/session";

interface ParentalChildrenPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ organization?: string }>;
}

const ParentalChildrenPage = async ({
  params,
  searchParams,
}: ParentalChildrenPageProps) => {
  const [{ locale }, { organization: organizationSlug }] = await Promise.all([
    params,
    searchParams,
  ]);

  const access = await getAttendanceAccess(organizationSlug);

  if (!access) notFound();

  const { memberRole, organization } = access;

  const query = new URLSearchParams({ organization: organization.slug });

  redirect({
    href: `${
      hasRolePermission(memberRole, { parentalChild: ["read"] })
        ? "/attendance/settings/employees"
        : "/attendance/mine/leave"
    }?${query.toString()}`,
    locale,
  });
};

export default ParentalChildrenPage;
