import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import PayrollRuleSets from ".";

import type { Locale } from "@/i18n/routing";

import { getPayrollRuleSets } from "@/utils/attendance";
import { getSession } from "@/utils/session";

interface PayrollRuleSetsPageProps {
  params: Promise<{ locale: Locale }>;
}

export const generateMetadata = async ({
  params,
}: PayrollRuleSetsPageProps): Promise<Metadata> => {
  const { locale } = await params;
  const tPayrollRuleSets = await getTranslations({
    locale,
    namespace: "payrollRuleSets",
  });

  return { title: tPayrollRuleSets("label") };
};

const PayrollRuleSetsPage = async () => {
  const [session, cookieStore] = await Promise.all([getSession(), cookies()]);

  if (session?.user?.role !== "admin") notFound();

  const ruleSets = await getPayrollRuleSets({
    headers: { cookie: cookieStore.toString() },
  });

  return <PayrollRuleSets ruleSets={ruleSets} />;
};

export default PayrollRuleSetsPage;
