import {
  Pagination,
  TablePagination,
  type TablePaginationProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
  "& .MuiTablePagination-input": {
    display: "none",
  },
  "& .MuiTablePagination-selectLabel": {
    display: "none",
  },

  [theme.breakpoints.up("sm")]: {
    "& .MuiTablePagination-input": {
      display: "inline-flex",
    },
    "& .MuiTablePagination-selectLabel": {
      display: "block",
    },
  },
})) as typeof TablePagination;

const PaginationActions = ({
  className,
  count,
  onPageChange,
  page,
  rowsPerPage,
}: Pick<
  TablePaginationProps,
  "className" | "count" | "onPageChange" | "page" | "rowsPerPage"
>) => (
  <Pagination
    className={className}
    color="primary"
    count={Math.ceil(count / rowsPerPage)}
    onChange={(event, newPage) => {
      onPageChange(event as React.MouseEvent<HTMLButtonElement>, newPage - 1);
    }}
    page={page + 1}
  />
);

export default PaginationActions;
