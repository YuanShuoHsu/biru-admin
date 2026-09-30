import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface PayrollPageProps {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PayrollPage = async ({ params, searchParams }: PayrollPageProps) => {
  const [{ locale }, query] = await Promise.all([params, searchParams]);

  const redirectParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query))
    for (const item of [value ?? []].flat()) redirectParams.append(key, item);

  redirect({
    href: `/attendance/payroll/statements?${redirectParams.toString()}`,
    locale,
  });
};

export default PayrollPage;
