"use client";

import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { Box, Skeleton, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

const Root = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.vars.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
}));

const ToolbarStack = styled(Stack)(({ theme }) => ({
  height: 52,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(1),
  paddingInline: theme.spacing(1),
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
}));

const RowStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(2),
  paddingInline: theme.spacing(1.25),
  borderBottom: `1px solid ${theme.vars.palette.divider}`,
}));

const HeaderStack = styled(RowStack)({ height: 56 });

const BodyStack = styled(RowStack)({ height: 52 });

const FooterStack = styled(Stack)(({ theme }) => ({
  height: 53,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  paddingInline: theme.spacing(2),
}));

const COLUMNS = [3, 2, 2, 1];

const Cells = () =>
  COLUMNS.map((flex, index) => (
    <Skeleton key={index} sx={{ flex }} variant="text" />
  ));

const DataGridSkeleton = () => (
  <Root aria-busy>
    <ToolbarStack>
      <Skeleton height={32} variant="circular" width={32} />
      <Skeleton height={32} variant="circular" width={32} />
      <Skeleton height={32} variant="circular" width={32} />
    </ToolbarStack>
    <HeaderStack>
      <Cells />
    </HeaderStack>
    {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
      <BodyStack key={index}>
        <Cells />
      </BodyStack>
    ))}
    <FooterStack>
      <Skeleton variant="text" width={200} />
    </FooterStack>
  </Root>
);

export default DataGridSkeleton;
