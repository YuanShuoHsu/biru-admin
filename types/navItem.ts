import type { SvgIconProps } from "@mui/material";

export type NavBadge = number | "error";

export type Slot = React.ComponentType<{ level: number }>;

export interface NavItem {
  badge?: NavBadge;
  children?: NavItem[];
  icon?: React.ComponentType<SvgIconProps>;
  label?: string;
  onClick?: () => void;
  path?: string;
  slot?: Slot;
  to?: string;
}
