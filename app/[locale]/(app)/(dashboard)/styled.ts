"use client";

import { Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

export const DashboardStack = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
  flex: 1,
  gap: theme.spacing(2),
}));

export const HeaderStack = styled(Stack)(({ theme }) => ({
  flexWrap: "wrap",
  alignItems: "center",
  gap: theme.spacing(2),
}));
