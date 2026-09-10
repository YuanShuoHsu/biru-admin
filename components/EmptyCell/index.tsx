import { Box } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

const EmptyCell = () => (
  <Box aria-hidden component="span" color="text.disabled">
    —
  </Box>
);

export default EmptyCell;

export const renderEmptyableCell: NonNullable<GridColDef["renderCell"]> = ({
  value,
}) => (value == null || value === "" ? <EmptyCell /> : undefined);
