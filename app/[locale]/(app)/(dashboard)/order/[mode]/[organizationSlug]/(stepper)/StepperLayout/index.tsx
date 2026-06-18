"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import HorizontalLinearStepper from "@/components/HorizontalLinearStepper";

import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface StepperLayoutProps {
  children: React.ReactNode;
}

const StepperLayout = ({ children }: StepperLayoutProps) => {
  const { mode, organizationSlug } = useParams<{
    mode: string;
    organizationSlug: string;
  }>();

  const tOrder = useTranslations("order");

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

export default StepperLayout;
