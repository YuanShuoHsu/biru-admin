import { Divider, type DividerProps } from "@mui/material";
import { styled } from "@mui/material/styles";

import type { Slot } from "@/types/navItem";

interface StyledDividerProps extends DividerProps {
  level: number;
}

const StyledDivider = styled(Divider, {
  shouldForwardProp: (prop) => prop !== "level",
})<StyledDividerProps>(({ level, theme }) => ({
  marginBlock: theme.spacing(1),
  marginLeft: theme.spacing(level * 2),
}));

const DividerSlot: Slot = ({ level }) => (
  <StyledDivider component="li" level={level} />
);

export default DividerSlot;
