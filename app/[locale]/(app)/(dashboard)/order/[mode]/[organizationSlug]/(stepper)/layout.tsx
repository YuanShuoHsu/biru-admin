import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import HorizontalLinearStepper from "@/components/HorizontalLinearStepper";

import { routing } from "@/i18n/routing";

import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

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
    <StyledContainer disableGutters maxWidth="sm">
      <HorizontalLinearStepper steps={steps} />
      {children}
    </StyledContainer>
  );
};

export default OrderModeOrganizationSlugStepperLayout;
