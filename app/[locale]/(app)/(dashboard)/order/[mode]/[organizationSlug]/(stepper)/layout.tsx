import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import HorizontalLinearStepper from "@/components/HorizontalLinearStepper";

import { routing } from "@/i18n/routing";

interface OrderModeOrganizationSlugStepperLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    mode: string;
    organizationSlug: string;
  }>;
}

const OrderModeOrganizationSlugStepperLayout = async ({
  children,
  params,
}: OrderModeOrganizationSlugStepperLayoutProps) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <>
      <HorizontalLinearStepper />
      {children}
    </>
  );
};

export default OrderModeOrganizationSlugStepperLayout;
