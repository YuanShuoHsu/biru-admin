// https://mui.com/x/react-data-grid/components/#CustomPaginationGrid.tsx

import { Pagination, type TablePaginationProps } from "@mui/material";
import {
  gridPageCountSelector,
  useGridApiContext,
  useGridSelector,
} from "@mui/x-data-grid";

const CustomPagination = ({
  className,
  onPageChange,
  page,
}: Pick<TablePaginationProps, "className" | "onPageChange" | "page">) => {
  const apiRef = useGridApiContext();
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Pagination
      className={className}
      color="primary"
      count={pageCount}
      onChange={(event, newPage) => {
        onPageChange(event as React.MouseEvent<HTMLButtonElement>, newPage - 1);
      }}
      page={page + 1}
    />
  );
};

export default CustomPagination;
