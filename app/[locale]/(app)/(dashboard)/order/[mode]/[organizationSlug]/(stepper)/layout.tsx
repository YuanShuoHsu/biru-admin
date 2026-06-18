import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import StepperLayout from "./StepperLayout";

import { routing } from "@/i18n/routing";

interface OrderModeOrganizationSlugStepperLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

const OrderModeOrganizationSlugStepperLayout = async ({
  children,
  params,
}: OrderModeOrganizationSlugStepperLayoutProps) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return <StepperLayout>{children}</StepperLayout>;
};

export default OrderModeOrganizationSlugStepperLayout;
