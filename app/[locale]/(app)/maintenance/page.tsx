import { setRequestLocale } from "next-intl/server";

import Maintenance from ".";

import type { Locale } from "@/i18n/routing";

interface MaintenancePageProps {
  params: Promise<{ locale: Locale }>;
}

const MaintenancePage = async ({ params }: MaintenancePageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <Maintenance />;
};

export default MaintenancePage;
