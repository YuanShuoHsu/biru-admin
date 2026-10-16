"use client";

import { DEFAULT_PAGE_SIZE } from "@/constants/pagination";

import { Box, Divider, Skeleton, Typography } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import usePagination from "@mui/material/usePagination";
import type { DataGridProps } from "@mui/x-data-grid";

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

const Row = styled(Box)({
  display: "flex",
});

const Cell = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  minWidth: 0,
  paddingInline: theme.spacing(1.25),
}));

const CheckboxCell = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 50,
});

interface CellsProps {
  checkboxSelection?: boolean;
  columnCount: number;
}

const Cells = ({ checkboxSelection, columnCount }: CellsProps) => (
  <>
    {checkboxSelection && (
      <CheckboxCell>
        <Skeleton height={18} variant="rounded" width={18} />
      </CheckboxCell>
    )}
    {Array.from({ length: columnCount }, (_, index) => (
      <Cell key={index} sx={{ flex: 1 }}>
        <Skeleton variant="text" width="100%" />
      </Cell>
    ))}
  </>
);

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

const PaginationRowsPerPageLabel = styled(PaginationText)(({ theme }) => ({
  display: "none",

  [theme.breakpoints.up("sm")]: {
    display: "block",
  },
}));

const PaginationSelect = styled(PaginationText)(({ theme }) => ({
  display: "none",
  marginLeft: 8,
  marginRight: 32,

  [theme.breakpoints.up("sm")]: {
    display: "block",
  },
}));

const PaginationSelectValue = styled(Typography)({
  boxSizing: "content-box",
  minWidth: 16,
  paddingLeft: 8,
  paddingRight: 24,
});

const PaginationActions = styled(Box)({
  display: "flex",
  alignItems: "center",
  flexShrink: 0,
  marginLeft: 20,
});

const PaginationItem = styled(Skeleton)({
  margin: "0 3px",
});

interface PaginationSkeletonProps {
  page: number;
  pageSize: number;
  rowCount: number;
}

const PaginationSkeleton = ({
  page,
  pageSize,
  rowCount,
}: PaginationSkeletonProps) => {
  const localeText =
    useTheme().components?.MuiDataGrid?.defaultProps?.localeText;

  const { items } = usePagination({
    count: rowCount > 0 ? Math.ceil(rowCount / pageSize) : 0,
    page: page + 1,
  });

  return (
    <Pagination>
      <PaginationSpacer />
      <PaginationRowsPerPageLabel variant="text">
        <Typography variant="body2">
          {localeText?.paginationRowsPerPage}
        </Typography>
      </PaginationRowsPerPageLabel>
      <PaginationSelect variant="text">
        <PaginationSelectValue variant="body2">
          {pageSize}
        </PaginationSelectValue>
      </PaginationSelect>
      <PaginationText variant="text">
        <Typography variant="body2">
          {localeText?.paginationDisplayedRows?.({
            from: rowCount === 0 ? 0 : page * pageSize + 1,
            to: Math.min(rowCount, (page + 1) * pageSize),
            count: rowCount,
            estimated: undefined,
          })}
        </Typography>
      </PaginationText>
      <PaginationActions>
        {items.map(({ type }, index) =>
          type.endsWith("ellipsis") ? (
            <PaginationItem key={index} variant="text" width={32} />
          ) : (
            <PaginationItem
              key={index}
              height={32}
              variant="circular"
              width={32}
            />
          ),
        )}
      </PaginationActions>
    </Pagination>
  );
};

export type DataGridSkeletonProps = Partial<
  Pick<
    DataGridProps,
    | "checkboxSelection"
    | "columnVisibilityModel"
    | "columns"
    | "hideFooter"
    | "initialState"
    | "loading"
    | "paginationModel"
    | "rowCount"
    | "rows"
  >
>;

const DataGridSkeleton = ({
  checkboxSelection,
  columnVisibilityModel,
  columns = [],
  hideFooter,
  initialState,
  loading,
  paginationModel,
  rows = [],
  rowCount = rows.length,
}: DataGridSkeletonProps) => {
  const { page = 0, pageSize = DEFAULT_PAGE_SIZE } =
    paginationModel ?? initialState?.pagination?.paginationModel ?? {};
  const visibilityModel =
    columnVisibilityModel ?? initialState?.columns?.columnVisibilityModel;
  const columnCount = columns.filter(
    ({ field }) => visibilityModel?.[field] !== false,
  ).length;
  const rowsOnPage =
    loading && rows.length === 0 ? pageSize : Math.min(rows.length, pageSize);

  return (
    <Root aria-busy>
      <Toolbar>
        <ToolbarButton />
        <ToolbarButton />
        <ToolbarDivider flexItem orientation="vertical" variant="middle" />
        <ToolbarButton />
        <ToolbarButton />
      </Toolbar>
      <Header>
        <Cells
          checkboxSelection={checkboxSelection}
          columnCount={columnCount}
        />
      </Header>
      <Body>
        {Array.from({ length: rowsOnPage }, (_, index) => (
          <BodyRow key={index}>
            <Cells
              checkboxSelection={checkboxSelection}
              columnCount={columnCount}
            />
          </BodyRow>
        ))}
      </Body>
      {!hideFooter && (
        <Footer>
          <PaginationSkeleton
            page={page}
            pageSize={pageSize}
            rowCount={rowCount}
          />
        </Footer>
      )}
    </Root>
  );
};

export default DataGridSkeleton;
