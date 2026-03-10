import { setRequestLocale } from "next-intl/server";

import Dashboard from ".";

import type { Locale } from "@/i18n/routing";

interface DashboardPageProps {
  params: Promise<{ locale: Locale }>;
}

const DashboardPage = async ({ params }: DashboardPageProps) => {
  const { locale } = await params;

  setRequestLocale(locale);

  return <Dashboard />;
};

export default DashboardPage;
