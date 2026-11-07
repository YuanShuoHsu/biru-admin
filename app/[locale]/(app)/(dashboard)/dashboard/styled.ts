"use client";

import { Card, CardActionArea, CardContent, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";

export const SectionsStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  transition: theme.transitions.create("opacity"),
}));

export const StyledCard = styled(Card)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
});

export const StyledCardActionArea = styled(CardActionArea)({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
});

export const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const StatValueStack = styled(Stack)({
  justifyContent: "space-between",
  alignItems: "center",
});

export const RevenueValueStack = styled(Stack)(({ theme }) => ({
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const StyledSparkLineChart = styled(SparkLineChart, {
  shouldForwardProp: (prop) => prop !== "gradientId",
})<{ gradientId: string }>(({ gradientId }) => ({
  "& .MuiLineChart-area": {
    fill: `url('#${gradientId}')`,
  },
}));

export const StyledLineChart = styled(LineChart, {
  shouldForwardProp: (prop) => prop !== "gradientId",
})<{ gradientId: string }>(({ gradientId }) => ({
  "& .MuiLineChart-area": {
    fill: `url('#${gradientId}')`,
  },
}));

export const StyledBarChart = styled(BarChart, {
  shouldForwardProp: (prop) => prop !== "gradientId",
})<{ gradientId: string }>(({ gradientId }) => ({
  "& .MuiBarChart-element": {
    fill: `url('#${gradientId}')`,
  },
}));
