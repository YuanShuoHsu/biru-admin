"use client";

import { Paper, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

export const CHART_HEIGHT = "clamp(420px, calc(100dvh - 360px), 880px)";

export const Board = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  [theme.breakpoints.up("lg")]: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
}));

export const SidePanel = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  [theme.breakpoints.up("lg")]: { flexShrink: 0, width: 320 },
}));

export const Panel = styled(Paper)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2),
}));
