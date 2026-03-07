"use client";

import React from "react";

import {
  Card,
  CardActions,
  CardContent,
  CardHeader,
  type CardProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingBottom: 0,
}));

export const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  paddingTop: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
}));

const FormCard = React.forwardRef<HTMLFormElement, CardProps<"form">>(
  (props, ref) => <Card ref={ref} component="form" {...props} />,
);

FormCard.displayName = "FormCard";

export default FormCard;
