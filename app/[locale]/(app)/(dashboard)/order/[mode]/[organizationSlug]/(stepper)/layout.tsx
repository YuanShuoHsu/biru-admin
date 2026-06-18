import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const { locale, mode, organizationSlug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const tOrder = await getTranslations({ locale, namespace: "order" });

  const base = `/order/${mode}/${organizationSlug}`;
  const steps = [
    { label: tOrder("label"), path: base },
    {
      label: tOrder("mode.storeSlug.tableNumber.stepper.cart.label"),
      path: `${base}/cart`,
    },
    {
      label: tOrder("mode.storeSlug.tableNumber.stepper.checkout.label"),
      path: `${base}/checkout`,
    },
    {
      label: tOrder("mode.storeSlug.tableNumber.stepper.complete.label"),
      path: `${base}/complete`,
    },
  ];

  return (
    <>
      <HorizontalLinearStepper steps={steps} />
      {children}
    </>
  );
};

export default OrderModeOrganizationSlugStepperLayout;
