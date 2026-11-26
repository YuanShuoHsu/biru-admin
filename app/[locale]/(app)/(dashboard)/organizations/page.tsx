import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

import Organizations from ".";

import type { Locale } from "@/i18n/routing";

import type { MyOrganization } from "@/types/organizations";

import { fetcher } from "@/utils/fetcher";
import { getOrganizations } from "@/utils/organizations";
import { getSession } from "@/utils/session";

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
  const [cookieStore, session] = await Promise.all([cookies(), getSession()]);
  const fetchOptions = { headers: { cookie: cookieStore.toString() } };

  const [rows, organizations] = await Promise.all([
    fetcher<MyOrganization[]>("/api/users/me/organizations", fetchOptions),
    session?.user.role === "admin" ? getOrganizations(fetchOptions) : [],
  ]);

  return <Organizations organizations={organizations} rows={rows} />;
};

const OrganizationsPage = () => (
  <Suspense fallback={<Organizations loading />}>
    <OrganizationsContent />
  </Suspense>
);

export default OrganizationsPage;
