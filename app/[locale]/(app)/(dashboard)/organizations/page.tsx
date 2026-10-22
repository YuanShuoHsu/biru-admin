import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

import Organizations from ".";

import type { Locale } from "@/i18n/routing";

import type { MyOrganization } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";

interface OrganizationsPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: OrganizationsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tOrganizations = await getTranslations({
    locale,
    namespace: "organizations",
  });

  return { title: tOrganizations("label") };
};

const OrganizationsContent = async () => {
  const cookieStore = await cookies();

  const rows = await fetcher<MyOrganization[]>("/api/users/me/organizations", {
    headers: { cookie: cookieStore.toString() },
  });

  return <Organizations rows={rows} />;
};

const OrganizationsPage = () => (
  <Suspense fallback={<Organizations loading />}>
    <OrganizationsContent />
  </Suspense>
);

export default OrganizationsPage;
