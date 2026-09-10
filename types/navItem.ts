import type { SvgIconProps } from "@mui/material";

export type Slot = React.ComponentType<{ level: number }>;

export interface NavItem {
  children?: NavItem[];
  icon?: React.ComponentType<SvgIconProps>;
  label?: string;
  onClick?: () => void;
  path?: string;
  slot?: Slot;
  to?: string;
}
