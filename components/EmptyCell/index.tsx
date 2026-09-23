import { Box, type BoxProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";

const StyledBox = styled(Box)<BoxProps>(({ theme }) => ({
  color: theme.vars.palette.text.disabled,
}));

const EmptyCell = () => (
  <StyledBox aria-hidden component="span">
    —
  </StyledBox>
);

export const renderEmptyableCell: NonNullable<GridColDef["renderCell"]> = ({
  value,
}) => (value == null || value === "" ? <EmptyCell /> : undefined);

export default EmptyCell;
