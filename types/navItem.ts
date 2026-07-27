import type { SvgIconProps } from "@mui/material";

export interface NavItem {
  children?: NavItem[];
  icon?: React.ComponentType<SvgIconProps>;
  label?: string;
  onClick?: () => void;
  path?: string;
  slot?: React.ComponentType<{ level: number }>;
  to?: string;
}
