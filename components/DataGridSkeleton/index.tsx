"use client";

import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { Box, Divider, Skeleton } from "@mui/material";
import { styled } from "@mui/material/styles";

const Root = styled(Box)(({ theme }) => ({
  flex: 1,
  height: "100%",
  minWidth: 0,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: `1px solid ${theme.vars.palette.TableCell.border}`,
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.vars.palette.background.paper,
}));

const Toolbar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(0.25),
  padding: theme.spacing(0.75),
  minHeight: 52,
  borderBottom: `1px solid ${theme.vars.palette.TableCell.border}`,
}));

const ToolbarButton = () => (
  <Skeleton height={36} variant="circular" width={36} />
);

const ToolbarDivider = styled(Divider)(({ theme }) => ({
  marginInline: theme.spacing(0.5),
}));

const Row = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2.5),
  paddingInline: theme.spacing(1.25),
}));

const COLUMNS = [3, 2, 2, 1];

const Cells = () =>
  COLUMNS.map((flex, index) => (
    <Skeleton key={index} sx={{ flex }} variant="text" />
  ));

const Header = styled(Row)(({ theme }) => ({
  height: 56,
  borderBottom: `1px solid ${theme.vars.palette.TableCell.border}`,
}));

const Body = styled(Box)({
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
});

const BodyRow = styled(Row)(({ theme }) => ({
  height: 52,
  borderTop: `1px solid ${theme.vars.palette.TableCell.border}`,

  "&:first-of-type": {
    borderTopColor: "transparent",
  },
}));

const Footer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  minHeight: 52,
  borderTop: `1px solid ${theme.vars.palette.TableCell.border}`,
}));

const Pagination = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  minHeight: 52,
  paddingLeft: theme.spacing(2),
  paddingRight: 2,

  [theme.breakpoints.up("sm")]: {
    paddingLeft: theme.spacing(3),
  },
}));

const PaginationSpacer = styled(Box)({
  flex: "1 1 100%",
});

const PaginationText = styled(Skeleton)({
  flexShrink: 0,
});

const PaginationSelect = styled(PaginationText)({
  marginLeft: 8,
  marginRight: 32,
});

const PaginationActions = styled(Box)({
  display: "flex",
  flexShrink: 0,
  marginLeft: 20,
});

const PaginationItem = styled(Skeleton)({
  margin: "0 3px",
});

const DataGridSkeleton = () => (
  <Root aria-busy>
    <Toolbar>
      <ToolbarButton />
      <ToolbarButton />
      <ToolbarDivider flexItem orientation="vertical" variant="middle" />
      <ToolbarButton />
      <ToolbarButton />
    </Toolbar>
    <Header>
      <Cells />
    </Header>
    <Body>
      {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
        <BodyRow key={index}>
          <Cells />
        </BodyRow>
      ))}
    </Body>
    <Footer>
      <Pagination>
        <PaginationSpacer />
        <PaginationText variant="text" width={61} />
        <PaginationSelect variant="text" width={48} />
        <PaginationText variant="text" width={54} />
        <PaginationActions>
          <PaginationItem height={32} variant="circular" width={32} />
          <PaginationItem height={32} variant="circular" width={32} />
          <PaginationItem height={32} variant="circular" width={32} />
        </PaginationActions>
      </Pagination>
    </Footer>
  </Root>
);

export default DataGridSkeleton;
