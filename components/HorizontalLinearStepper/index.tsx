// https://mui.com/material-ui/react-stepper/#CustomizedSteppers.tsx
// https://mui.com/material-ui/react-stepper/#HorizontalLinearStepper.tsx

"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { usePathname } from "@/i18n/navigation";

import {
  Step,
  StepConnector,
  stepConnectorClasses,
  StepLabel,
  Stepper,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import type { RouteParams } from "@/types/routeParams";

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: "calc(-50% + 16px)",
    right: "calc(50% + 16px)",
  },
  [`&.${stepConnectorClasses.active} .${stepConnectorClasses.line}`]: {
    borderColor: theme.vars.palette.primary.main,
  },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: {
    borderColor: theme.vars.palette.primary.main,
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.vars.palette.divider,
    borderTopWidth: 3,
    borderRadius: 1,
    transition: theme.transitions.create("border-color"),
  },
}));

const StyledStepLabel = styled(StepLabel)(({ theme }) => ({
  "& .MuiStepIcon-root": {
    transition: theme.transitions.create("color"),

    "& .MuiStepIcon-text": {
      transition: theme.transitions.create("fill"),
    },
  },

  "& .MuiStepLabel-label": {
    transition: theme.transitions.create("color"),
  },
}));

const HorizontalLinearStepper = () => {
  const tOrder = useTranslations("order");

  const { locale, storeSlug } = useParams<RouteParams>();

  const pathname = usePathname();

  const base = `/order/${storeSlug}`;
  const stepPathnames = [base, `${base}/checkout`, `${base}/complete`];
  const activeStep = stepPathnames.findIndex(
    (path) => pathname === `/${locale}${path}`,
  );

  const steps = [
    tOrder("label"),
    tOrder("mode.storeSlug.tableNumber.stepper.checkout.label"),
    tOrder("mode.storeSlug.tableNumber.stepper.complete.label"),
  ];

  return (
    <Stepper activeStep={activeStep} connector={<QontoConnector />}>
      {steps.map((label, index) => (
        <Step key={label} completed={activeStep > index}>
          <StyledStepLabel>{label}</StyledStepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default HorizontalLinearStepper;
