import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import Maintenance from ".";

import type { Locale } from "@/i18n/routing";

interface MaintenancePageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: MaintenancePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "maintenance" });

  return { robots: { follow: false, index: false }, title: t("title") };
};

const MaintenancePage = async ({ params }: MaintenancePageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <Maintenance />;
};

export default MaintenancePage;
