import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import Maintenance from ".";

import type { Locale } from "@/i18n/routing";

interface MaintenancePageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: MaintenancePageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tMaintenance = await getTranslations({
    locale,
    namespace: "maintenance",
  });

  return {
    robots: { follow: false, index: false },
    title: tMaintenance("title"),
  };
};

const MaintenancePage = () => <Maintenance />;

export default MaintenancePage;
